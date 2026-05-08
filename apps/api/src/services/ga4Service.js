/**
 * GA4 Data API service.
 *
 * Authentication: uses the user's stored OAuth2 tokens (via googleTokenService).
 * Sites without a connected Google account are silently skipped.
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const { PostAnalytics, SiteAnalytics, Post } = require('../models');
const { Op } = require('sequelize');
const { getValidClient } = require('./googleTokenService');

/**
 * Build an authenticated GA4 Data API client using the site owner's OAuth tokens.
 * Returns null if the user has no Google connection.
 *
 * @param {object} site - Site model instance (must have userId)
 * @returns {Promise<BetaAnalyticsDataClient|null>}
 */
async function buildClientForSite(site) {
  try {
    const oauthClient = await getValidClient(site.userId);
    return new BetaAnalyticsDataClient({ authClient: oauthClient });
  } catch (err) {
    console.warn(`[ga4Service] No valid OAuth client for site ${site.id}: ${err.message}`);
    return null;
  }
}

/**
 * Format a Date object as YYYY-MM-DD for GA4 API.
 */
function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Pull site-level metrics from GA4 for the given date range and upsert into site_analytics.
 * @param {object} site - Site model instance (must have gaPropertyId)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 */
async function syncSiteMetrics(site, startDate, endDate) {
  const client = await buildClientForSite(site);
  if (!client || !site.gaPropertyId) return;

  console.log(`[ga4Service] Syncing site metrics for ${site.id} (${startDate} → ${endDate})`);

  try {
    const [siteResponse] = await client.runReport({
      property: `properties/${site.gaPropertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'organicGoogleSearchSessions' },
      ],
    });

    for (const row of (siteResponse.rows || [])) {
      const date = row.dimensionValues[0].value; // YYYYMMDD from GA4
      const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      const [sessions, users, newUsers, avgDuration, bounceRate, organicSessions] =
        row.metricValues.map((v) => v.value);

      await SiteAnalytics.upsert({
        siteId: site.id,
        date: formattedDate,
        sessions: parseInt(sessions, 10) || 0,
        users: parseInt(users, 10) || 0,
        newUsers: parseInt(newUsers, 10) || 0,
        avgSessionDurationSeconds: parseFloat(avgDuration) || null,
        bounceRate: parseFloat(bounceRate) || null,
        organicSessions: parseInt(organicSessions, 10) || null,
      });
    }

    console.log(`[ga4Service] Site metrics synced: ${siteResponse.rows?.length || 0} days`);
  } catch (err) {
    console.error(`[ga4Service] Failed to sync site metrics for ${site.id}:`, err.message);
  }
}

/**
 * Pull post-level pageview metrics from GA4 and upsert into post_analytics.
 * Maps GA4 pagePaths to posts by matching the slug.
 * @param {object} site - Site model instance (must have gaPropertyId)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 */
async function syncPostMetrics(site, startDate, endDate) {
  const client = await buildClientForSite(site);
  if (!client || !site.gaPropertyId) return;

  console.log(`[ga4Service] Syncing post metrics for ${site.id} (${startDate} → ${endDate})`);

  // Load all posts for this site so we can map slugs → IDs
  const posts = await Post.findAll({ where: { siteId: site.id, status: 'published' } });
  if (!posts.length) return;

  const slugToPost = {};
  for (const post of posts) {
    // Match paths like /blog/my-slug/ or /post/my-slug or /my-slug/
    slugToPost[post.slug] = post;
  }

  try {
    const [postResponse] = await client.runReport({
      property: `properties/${site.gaPropertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }, { name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });

    for (const row of (postResponse.rows || [])) {
      const date = row.dimensionValues[0].value;
      const pagePath = row.dimensionValues[1].value;
      const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;

      // Extract slug from path: /blog/my-slug/ → my-slug
      const slugMatch = pagePath.replace(/\/$/, '').split('/').pop();
      const post = slugToPost[slugMatch];
      if (!post) continue;

      const [pageviews, sessions, avgDuration, bounceRate] =
        row.metricValues.map((v) => v.value);

      await PostAnalytics.upsert({
        siteId: site.id,
        postId: post.id,
        date: formattedDate,
        pageviews: parseInt(pageviews, 10) || 0,
        sessions: parseInt(sessions, 10) || 0,
        avgSessionDurationSeconds: parseFloat(avgDuration) || null,
        bounceRate: parseFloat(bounceRate) || null,
      });
    }

    console.log(`[ga4Service] Post metrics synced: ${postResponse.rows?.length || 0} rows`);
  } catch (err) {
    console.error(`[ga4Service] Failed to sync post metrics for ${site.id}:`, err.message);
  }
}

/**
 * Sync both site-level and post-level metrics for a site.
 * Defaults to syncing yesterday's data.
 * @param {object} site
 * @param {string} [startDate] - YYYY-MM-DD (default: yesterday)
 * @param {string} [endDate]   - YYYY-MM-DD (default: yesterday)
 */
async function syncSite(site, startDate, endDate) {
  if (!site.gaPropertyId) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const defaultDate = toDateString(yesterday);

  const start = startDate || defaultDate;
  const end = endDate || defaultDate;

  await syncSiteMetrics(site, start, end);
  await syncPostMetrics(site, start, end);
}

module.exports = { syncSite };
