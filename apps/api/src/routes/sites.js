const router = require('express').Router();
const { Site } = require('../models');
const auth = require('../middlewares/auth');
const ownership = require('../middlewares/ownership');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema } = require('../validators/sites');
const { enqueueBuild } = require('../services/buildQueue');

// All routes require auth
router.use(auth);

// GET /api/sites
router.get('/', async (req, res, next) => {
  try {
    const sites = await Site.findAll({ where: { userId: req.user.userId } });
    res.json(sites);
  } catch (err) {
    next(err);
  }
});

// POST /api/sites
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const site = await Site.create({ ...req.body, userId: req.user.userId });
    res.status(201).json(site);
  } catch (err) {
    next(err);
  }
});

// GET /api/sites/:siteId
router.get('/:siteId', ownership, (req, res) => {
  res.json(req.site);
});

// PUT /api/sites/:siteId
router.put('/:siteId', ownership, validate(updateSchema), async (req, res, next) => {
  try {
    await req.site.update(req.body);
    enqueueBuild(req.site.id, 'settings_change').catch((err) =>
      console.error('[sites] Failed to enqueue build:', err.message),
    );
    res.json(req.site);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sites/:siteId
router.delete('/:siteId', ownership, async (req, res, next) => {
  try {
    await req.site.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
