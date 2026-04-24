const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().min(1).max(100).optional(),
  description: Joi.string().optional().allow('', null),
});

const update = create.fork(['name'], (s) => s.optional());

module.exports = { create, update };
