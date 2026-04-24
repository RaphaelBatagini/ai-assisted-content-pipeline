const router = require('express').Router({ mergeParams: true });
const { Post, Category, PostCategory } = require('../models');
const validate = require('../middlewares/validate');
const { create: createSchema, update: updateSchema } = require('../validators/posts');
const { enqueueBuild } = require('../services/buildQueue');

function calcReadingTime(content) {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / 200);
}

// GET /api/sites/:siteId/posts
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      where: { siteId: req.site.id },
      include: [{ model: Category, through: { attributes: [] } }],
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// POST /api/sites/:siteId/posts
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { categoryIds, content, ...rest } = req.body;
    const readingTimeMinutes = calcReadingTime(content);
    const post = await Post.create({
      ...rest,
      content,
      readingTimeMinutes,
      siteId: req.site.id,
      authorId: req.user.userId,
    });
    if (categoryIds && categoryIds.length) {
      await PostCategory.bulkCreate(categoryIds.map((cid) => ({ postId: post.id, categoryId: cid })));
    }
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// GET /api/sites/:siteId/posts/:postId
router.get('/:postId', async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId, siteId: req.site.id },
      include: [{ model: Category, through: { attributes: [] } }],
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// PUT /api/sites/:siteId/posts/:postId
router.put('/:postId', validate(updateSchema), async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId, siteId: req.site.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const { categoryIds, content, ...rest } = req.body;
    if (content) rest.readingTimeMinutes = calcReadingTime(content);
    await post.update({ ...rest, ...(content ? { content } : {}) });
    if (categoryIds !== undefined) {
      await PostCategory.destroy({ where: { postId: post.id } });
      if (categoryIds.length) {
        await PostCategory.bulkCreate(categoryIds.map((cid) => ({ postId: post.id, categoryId: cid })));
      }
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// PUT /api/sites/:siteId/posts/:postId/publish
router.put('/:postId/publish', async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId, siteId: req.site.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.update({ status: 'published', publishedAt: new Date() });
    enqueueBuild(req.site.id, 'content_change').catch((err) =>
      console.error('[posts] Failed to enqueue build:', err.message),
    );
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// PUT /api/sites/:siteId/posts/:postId/archive
router.put('/:postId/archive', async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId, siteId: req.site.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.update({ status: 'archived' });
    res.json(post);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sites/:siteId/posts/:postId
router.delete('/:postId', async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId, siteId: req.site.id } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    await post.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
