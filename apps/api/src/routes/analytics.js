const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Op, fn, col, literal } = require('sequelize');
const { enqueueAnalyticsEvent } = require('../services/analyticsQueue');
const { Site, Post, PostAnalytics, SiteAnalytics, AnalyticsEvent, Category } = require('../models');
const ownership = require('../middlewares/ownership');

// ─── Public router: POST /api/analytics/events ───────────────────────────────

const analyticsRouter = express.Router();

// Allow all origins for the tracking endpoint — it's called from tenant static sites
analyticsRouter.use(cors({ origin: '*' }));

const eventsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

const ALLOWED_EVENT_TYPES = ['cta_click'];

analyticsRouter.post('/events', eventsLimiter, async (req, res) => {
  // Always return 202 immediately — fire-and-forget
  res.status(202).end();

  try {
    const { siteId, eventType, postId, metadata } = req.body;
    if (!siteId || !eventType || !ALLOWED_EVENT_TYPES.includes(eventType)) return;

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;

    await enqueueAnalyticsEvent({
      siteId,
      postId: postId || null,
      eventType,
      metadata: metadata || null,
      ip,
      userAgent: req.headers['user-agent'] || null,
    });
  } catch {
    // Swallow — response already sent
  }
});

// ─── Site analytics router: GET /api/sites/:siteId/analytics/* ───────────────

const siteAnalyticsRouter = express.Router({ mergeParams: true });

/**
 * Parse startDate / endDate query params.
 * Defaults to the last 30 days.
 */
function parseDateRange(query) {
  const now = new Date();
  const defaultEnd = now.toISOString().slice(0, 10);
  const defaultStart = new Date(now.setDate(now.getDate() - 29)).toISOString().slice(0, 10);

  const startDate = query.startDate || defaultStart;
  const endDate = query.endDate || defaultEnd;
  return { startDate, endDate };
}

// GET /api/sites/:siteId/analytics/overview
siteAnalyticsRouter.get('/overview', ownership, async (req, res, next) => {
  try {
    const site = req.site;
    const { startDate, endDate } = parseDateRange(req.query);

    // 1. Visits trend (sessions by day)
    const siteRows = await SiteAnalytics.findAll({
      where: {
        siteId: site.id,
        date: { [Op.between]: [startDate, endDate] },
      },
      order: [['date', 'ASC']],
    });

    const visitsTrend = siteRows.map((r) => ({ date: r.date, sessions: r.sessions }));

    // 2. Totals aggregated
    const totalsAgg = siteRows.reduce(
      (acc, r) => {
        acc.sessions += r.sessions;
        acc.users += r.users;
        acc.newUsers += r.newUsers;
        return acc;
      },
      { sessions: 0, users: 0, newUsers: 0 },
    );

    const lastRow = siteRows[siteRows.length - 1] || {};
    totalsAgg.avgSessionDurationSeconds = lastRow.avgSessionDurationSeconds || null;
    totalsAgg.bounceRate = lastRow.bounceRate || null;

    // Total CTA clicks in period
    const ctaCount = await AnalyticsEvent.count({
      where: {
        siteId: site.id,
        eventType: 'cta_click',
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59Z')] },
      },
    });
    totalsAgg.totalCtaClicks = ctaCount;

    // 3. Top posts by pageviews
    const postPageviews = await PostAnalytics.findAll({
      where: {
        siteId: site.id,
        date: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        'postId',
        [fn('SUM', col('pageviews')), 'totalPageviews'],
      ],
      group: ['postId'],
      order: [[literal('"totalPageviews"'), 'DESC']],
      limit: 10,
      raw: true,
    });

    // Fetch CTA clicks per post
    const postIds = postPageviews.map((r) => r.postId);
    const ctaByPost = await AnalyticsEvent.findAll({
      where: {
        siteId: site.id,
        eventType: 'cta_click',
        postId: { [Op.in]: postIds.length ? postIds : [null] },
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59Z')] },
      },
      attributes: ['postId', [fn('COUNT', col('id')), 'ctaClicks']],
      group: ['postId'],
      raw: true,
    });

    const ctaByPostMap = {};
    for (const r of ctaByPost) ctaByPostMap[r.postId] = parseInt(r.ctaClicks, 10);

    const postsData = postIds.length
      ? await Post.findAll({ where: { id: { [Op.in]: postIds } }, attributes: ['id', 'title', 'slug'] })
      : [];
    const postMap = {};
    for (const p of postsData) postMap[p.id] = p;

    const topPosts = postPageviews.map((r) => {
      const views = parseInt(r.totalPageviews, 10);
      const clicks = ctaByPostMap[r.postId] || 0;
      return {
        postId: r.postId,
        title: postMap[r.postId]?.title || 'Unknown',
        slug: postMap[r.postId]?.slug || '',
        pageviews: views,
        ctaClicks: clicks,
        conversionRate: views > 0 ? +(clicks / views).toFixed(4) : 0,
      };
    });

    // 4. Top posts by conversion rate (min 10 pageviews to filter noise)
    const topPostsByConversion = [...topPosts]
      .filter((p) => p.pageviews >= 10)
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 5);

    // 5. Top categories by sum of their posts' pageviews
    const postIdsAll = (await PostAnalytics.findAll({
      where: { siteId: site.id, date: { [Op.between]: [startDate, endDate] } },
      attributes: ['postId'],
      group: ['postId'],
      raw: true,
    })).map((r) => r.postId);

    let topCategories = [];
    if (postIdsAll.length) {
      const postsWithCats = await Post.findAll({
        where: { id: { [Op.in]: postIdsAll } },
        include: [{ model: Category, through: { attributes: [] } }],
      });

      const catViews = {};
      const catNames = {};
      for (const p of postsWithCats) {
        const pa = postPageviews.find((r) => r.postId === p.id);
        const views = pa ? parseInt(pa.totalPageviews, 10) : 0;
        for (const cat of p.Categories || []) {
          catViews[cat.id] = (catViews[cat.id] || 0) + views;
          catNames[cat.id] = cat.name;
        }
      }

      topCategories = Object.entries(catViews)
        .map(([id, pageviews]) => ({ categoryId: id, name: catNames[id], pageviews }))
        .sort((a, b) => b.pageviews - a.pageviews)
        .slice(0, 5);
    }

    // 6. Editorial velocity: posts published in period
    const editorialVelocity = await Post.count({
      where: {
        siteId: site.id,
        publishedAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59Z')] },
      },
    });

    res.json({
      visitsTrend,
      totals: totalsAgg,
      topPosts,
      topPostsByConversion,
      topCategories,
      editorialVelocity,
      newVsReturning: {
        newUsers: totalsAgg.newUsers,
        returningUsers: Math.max(0, totalsAgg.users - totalsAgg.newUsers),
      },
      gaConfigured: !!site.gaPropertyId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sites/:siteId/analytics/posts
siteAnalyticsRouter.get('/posts', ownership, async (req, res, next) => {
  try {
    const site = req.site;
    const { startDate, endDate } = parseDateRange(req.query);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const pageviewsAgg = await PostAnalytics.findAll({
      where: {
        siteId: site.id,
        date: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        'postId',
        [fn('SUM', col('pageviews')), 'totalPageviews'],
        [fn('SUM', col('sessions')), 'totalSessions'],
        [fn('AVG', col('avg_session_duration_seconds')), 'avgDuration'],
        [fn('AVG', col('bounce_rate')), 'avgBounceRate'],
      ],
      group: ['postId'],
      order: [[literal('"totalPageviews"'), 'DESC']],
      limit,
      offset,
      raw: true,
    });

    const postIds = pageviewsAgg.map((r) => r.postId);

    const ctaByPost = postIds.length
      ? await AnalyticsEvent.findAll({
          where: {
            siteId: site.id,
            eventType: 'cta_click',
            postId: { [Op.in]: postIds },
            createdAt: { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59Z')] },
          },
          attributes: ['postId', [fn('COUNT', col('id')), 'ctaClicks']],
          group: ['postId'],
          raw: true,
        })
      : [];

    const ctaMap = {};
    for (const r of ctaByPost) ctaMap[r.postId] = parseInt(r.ctaClicks, 10);

    const posts = postIds.length
      ? await Post.findAll({ where: { id: { [Op.in]: postIds } }, attributes: ['id', 'title', 'slug'] })
      : [];
    const postMap = {};
    for (const p of posts) postMap[p.id] = p;

    const rows = pageviewsAgg.map((r) => {
      const views = parseInt(r.totalPageviews, 10);
      const clicks = ctaMap[r.postId] || 0;
      return {
        postId: r.postId,
        title: postMap[r.postId]?.title || 'Unknown',
        slug: postMap[r.postId]?.slug || '',
        pageviews: views,
        sessions: parseInt(r.totalSessions, 10),
        avgSessionDurationSeconds: r.avgDuration ? +parseFloat(r.avgDuration).toFixed(1) : null,
        bounceRate: r.avgBounceRate ? +parseFloat(r.avgBounceRate).toFixed(4) : null,
        ctaClicks: clicks,
        conversionRate: views > 0 ? +(clicks / views).toFixed(4) : 0,
      };
    });

    res.json({ rows, page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/sites/:siteId/analytics/categories
siteAnalyticsRouter.get('/categories', ownership, async (req, res, next) => {
  try {
    const site = req.site;
    const { startDate, endDate } = parseDateRange(req.query);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const pageviewsAgg = await PostAnalytics.findAll({
      where: {
        siteId: site.id,
        date: { [Op.between]: [startDate, endDate] },
      },
      attributes: ['postId', [fn('SUM', col('pageviews')), 'totalPageviews']],
      group: ['postId'],
      raw: true,
    });

    const postIds = pageviewsAgg.map((r) => r.postId);
    const viewMap = {};
    for (const r of pageviewsAgg) viewMap[r.postId] = parseInt(r.totalPageviews, 10);

    let rows = [];
    if (postIds.length) {
      const postsWithCats = await Post.findAll({
        where: { id: { [Op.in]: postIds } },
        include: [{ model: Category, through: { attributes: [] } }],
      });

      const catViews = {};
      const catNames = {};
      for (const p of postsWithCats) {
        for (const cat of p.Categories || []) {
          catViews[cat.id] = (catViews[cat.id] || 0) + (viewMap[p.id] || 0);
          catNames[cat.id] = cat.name;
        }
      }

      rows = Object.entries(catViews)
        .map(([id, pageviews]) => ({ categoryId: id, name: catNames[id], pageviews }))
        .sort((a, b) => b.pageviews - a.pageviews)
        .slice((page - 1) * limit, page * limit);
    }

    res.json({ rows, page, limit });
  } catch (err) {
    next(err);
  }
});

module.exports = { analyticsRouter, siteAnalyticsRouter };
