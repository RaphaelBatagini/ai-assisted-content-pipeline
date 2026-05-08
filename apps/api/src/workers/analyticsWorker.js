require('dotenv').config();

// Load models (needs DB connection)
require('../models');
const { AnalyticsEvent, Site, sequelize } = require('../models');
const { analyticsQueue } = require('../services/analyticsQueue');
const { syncSite } = require('../services/ga4Service');

const { Op } = require('sequelize');

const GA_SYNC_CRON = process.env.GA4_SYNC_CRON || '0 3 * * *'; // default: 3 AM UTC daily
const ANALYTICS_CONCURRENCY = parseInt(process.env.ANALYTICS_CONCURRENCY || '5', 10);

// ─── Event persistence worker ─────────────────────────────────────────────────

analyticsQueue.process('track-event', ANALYTICS_CONCURRENCY, async (job) => {
  const { siteId, postId, eventType, metadata, ip, userAgent } = job.data;
  try {
    await AnalyticsEvent.create({
      siteId,
      postId: postId || null,
      eventType,
      metadata: metadata || null,
      ip: ip || null,
      userAgent: userAgent || null,
    });
    console.log(`[analyticsWorker] Event recorded: ${eventType} for site ${siteId}`);
  } catch (err) {
    console.error('[analyticsWorker] Failed to persist event:', err.message);
    throw err; // allow Bull to retry
  }
});

// ─── GA4 daily sync worker ────────────────────────────────────────────────────

analyticsQueue.process('ga-sync', 1, async (job) => {
  const { siteId, startDate, endDate } = job.data;
  console.log(`[analyticsWorker] Running GA4 sync for site ${siteId}`);
  try {
    const site = await Site.findByPk(siteId);
    if (!site || !site.gaPropertyId) {
      console.log(`[analyticsWorker] Skipping GA4 sync — site ${siteId} has no GA property ID`);
      return;
    }
    await syncSite(site, startDate, endDate);
    console.log(`[analyticsWorker] GA4 sync complete for site ${siteId}`);
  } catch (err) {
    console.error(`[analyticsWorker] GA4 sync failed for site ${siteId}:`, err.message);
    throw err;
  }
});

// ─── Daily cron: enqueue GA4 sync for all active sites ───────────────────────

async function enqueueGa4SyncForAllSites() {
  try {
    const sites = await Site.findAll({
      where: {
        gaPropertyId: { [Op.not]: null },
      },
      include: [
        {
          model: require('../models').User,
          attributes: ['subscriptionStatus'],
          where: { subscriptionStatus: 'active' },
          required: true,
        },
      ],
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = yesterday.toISOString().slice(0, 10);

    for (const site of sites) {
      await analyticsQueue.add('ga-sync', { siteId: site.id, startDate: date, endDate: date });
    }

    console.log(`[analyticsWorker] Enqueued GA4 sync for ${sites.length} sites (date: ${date})`);
  } catch (err) {
    console.error('[analyticsWorker] Failed to enqueue GA4 sync jobs:', err.message);
  }
}

// Register the repeatable cron job (Bull deduplicates by key)
analyticsQueue.add(
  'ga-sync-trigger',
  {},
  {
    repeat: { cron: GA_SYNC_CRON },
    jobId: 'ga-sync-daily-trigger',
  },
);

// Handle the trigger job that fans out to per-site sync jobs
analyticsQueue.process('ga-sync-trigger', 1, async () => {
  await enqueueGa4SyncForAllSites();
});

// ─── Error / completion hooks ─────────────────────────────────────────────────

analyticsQueue.on('failed', (job, err) => {
  console.error(`[analyticsWorker] Job ${job.id} (${job.name}) failed:`, err.message);
});

analyticsQueue.on('error', (err) => {
  console.error('[analyticsWorker] Queue error:', err.message);
});

console.log(`[analyticsWorker] Started. GA4 sync cron: "${GA_SYNC_CRON}"`);
