const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  slug: Joi.string().min(1).max(100).required(),
  colorPalette: Joi.string()
    .valid('ocean_breeze', 'forest_green', 'sunset_orange', 'midnight_blue', 'rose_gold', 'slate_gray', 'lavender_mist', 'warm_sand')
    .required(),
  logoUrl: Joi.string().uri().optional().allow('', null),
  faviconUrl: Joi.string().uri().optional().allow('', null),
  contactEmail: Joi.string().email().required(),
  whatsapp: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  gaTrackingId: Joi.string().optional().allow('', null),
  gtmContainerId: Joi.string().optional().allow('', null),
});

const update = create.fork(
  ['name', 'slug', 'colorPalette', 'contactEmail'],
  (s) => s.optional()
);

module.exports = { create, update };
