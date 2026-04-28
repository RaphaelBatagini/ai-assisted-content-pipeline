const router = require('express').Router({ mergeParams: true });
const { ContentStrategyBrief } = require('../models');
const validate = require('../middlewares/validate');
const { create: createSchema } = require('../validators/contentStrategyBrief');
const { enqueueResearch } = require('../services/aiQueue');

// GET /api/sites/:siteId/content-strategy-brief
router.get('/', async (req, res, next) => {
  try {
    const brief = await ContentStrategyBrief.findOne({ where: { siteId: req.site.id } });
    if (!brief) return res.status(404).json({ error: 'No content strategy brief found for this site' });
    res.json(brief);
  } catch (err) {
    next(err);
  }
});

// POST /api/sites/:siteId/content-strategy-brief  (upsert)
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const {
      company_name,
      product_description,
      industry,
      target_audience,
      pain_points,
      differentiators,
      competitors,
      conversion_goal,
      content_goals,
      content_formats,
      tone_of_voice,
    } = req.body;

    const fields = {
      companyName: company_name,
      productDescription: product_description,
      industry,
      targetAudience: target_audience,
      painPoints: pain_points,
      differentiators: differentiators || null,
      competitors: competitors || null,
      conversionGoal: conversion_goal || null,
      contentGoals: content_goals || null,
      contentFormats: content_formats || null,
      toneOfVoice: tone_of_voice || 'professional',
    };

    const existing = await ContentStrategyBrief.findOne({ where: { siteId: req.site.id } });

    let brief;
    let created = false;

    if (existing) {
      await existing.update({
        ...fields,
        status: 'pending',
        errorMessage: null,
        roadmapJson: null,
        postsGenerated: 0,
      });
      brief = existing;
    } else {
      brief = await ContentStrategyBrief.create({ siteId: req.site.id, ...fields });
      created = true;
    }

    await enqueueResearch(brief.id, req.site.id);

    res.status(created ? 201 : 200).json(brief);
  } catch (err) {
    next(err);
  }
});

// POST /api/sites/:siteId/content-strategy-brief/retry
router.post('/retry', async (req, res, next) => {
  try {
    const brief = await ContentStrategyBrief.findOne({ where: { siteId: req.site.id } });
    if (!brief) return res.status(404).json({ error: 'No content strategy brief found for this site' });
    if (brief.status !== 'error') return res.status(409).json({ error: 'Brief is not in error state' });

    await brief.update({
      status: 'pending',
      errorMessage: null,
      roadmapJson: null,
      postsGenerated: 0,
    });

    await enqueueResearch(brief.id, req.site.id);

    res.json(brief);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
