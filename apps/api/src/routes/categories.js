const router = require('express').Router({ mergeParams: true });
const { Category } = require('../models');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema } = require('../validators/categories');

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

// GET /api/sites/:siteId/categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.findAll({ where: { siteId: req.site.id } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/sites/:siteId/categories
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const slug = req.body.slug || generateSlug(req.body.name);
    const category = await Category.create({ ...req.body, slug, siteId: req.site.id });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// GET /api/sites/:siteId/categories/:categoryId
router.get('/:categoryId', async (req, res, next) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.categoryId, siteId: req.site.id } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// PUT /api/sites/:siteId/categories/:categoryId
router.put('/:categoryId', validate(updateSchema), async (req, res, next) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.categoryId, siteId: req.site.id } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    if (req.body.name && !req.body.slug) req.body.slug = generateSlug(req.body.name);
    await category.update(req.body);
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sites/:siteId/categories/:categoryId
router.delete('/:categoryId', async (req, res, next) => {
  try {
    const category = await Category.findOne({ where: { id: req.params.categoryId, siteId: req.site.id } });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
