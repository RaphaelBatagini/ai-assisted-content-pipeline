const Joi = require('joi');

const contact = Joi.object({
  siteId: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  message: Joi.string().min(1).required(),
});

module.exports = { contact };
