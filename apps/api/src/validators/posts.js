const Joi = require('joi');

const create = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  slug: Joi.string().min(1).max(255).required(),
  excerpt: Joi.string().optional().allow('', null),
  content: Joi.string().required(),
  coverImageUrl: Joi.string().uri().optional().allow('', null),
  seoTitle: Joi.string().max(255).optional().allow('', null),
  seoDescription: Joi.string().max(255).optional().allow('', null),
  ogImageUrl: Joi.string().uri().optional().allow('', null),
  categoryIds: Joi.array().items(Joi.string().uuid()).optional(),
});

const update = create.fork(['title', 'slug', 'content'], (s) => s.optional());

module.exports = { create, update };
