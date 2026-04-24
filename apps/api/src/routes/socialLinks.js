const router = require('express').Router({ mergeParams: true });
const { SocialLink } = require('../models');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema } = require('../validators/socialLinks');

// GET /api/sites/:siteId/social-links
router.get('/', async (req, res, next) => {
  try {
    const links = await SocialLink.findAll({ where: { siteId: req.site.id } });
    res.json(links);
  } catch (err) {
    next(err);
  }
});

// POST /api/sites/:siteId/social-links
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const link = await SocialLink.create({ ...req.body, siteId: req.site.id });
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

// PUT /api/sites/:siteId/social-links/:linkId
router.put('/:linkId', validate(updateSchema), async (req, res, next) => {
  try {
    const link = await SocialLink.findOne({ where: { id: req.params.linkId, siteId: req.site.id } });
    if (!link) return res.status(404).json({ error: 'Social link not found' });
    await link.update(req.body);
    res.json(link);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sites/:siteId/social-links/:linkId
router.delete('/:linkId', async (req, res, next) => {
  try {
    const link = await SocialLink.findOne({ where: { id: req.params.linkId, siteId: req.site.id } });
    if (!link) return res.status(404).json({ error: 'Social link not found' });
    await link.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
