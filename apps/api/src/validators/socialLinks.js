const Joi = require('joi');

const create = Joi.object({
  platform: Joi.string()
    .valid('instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'other')
    .required(),
  url: Joi.string().uri().required(),
});

const update = create.fork(['platform', 'url'], (s) => s.optional());

module.exports = { create, update };
