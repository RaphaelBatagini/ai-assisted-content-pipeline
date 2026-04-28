const Joi = require('joi');

const toneOfVoiceValues = ['professional', 'casual', 'technical', 'conversational'];

const create = Joi.object({
  company_name: Joi.string().min(1).max(200).required(),
  product_description: Joi.string().required(),
  industry: Joi.string().min(1).max(100).required(),
  target_audience: Joi.string().required(),
  pain_points: Joi.string().required(),
  differentiators: Joi.string().optional().allow('', null),
  competitors: Joi.string().optional().allow('', null),
  conversion_goal: Joi.string().optional().allow('', null),
  content_goals: Joi.string().optional().allow('', null),
  content_formats: Joi.string().optional().allow('', null),
  tone_of_voice: Joi.string().valid(...toneOfVoiceValues).optional(),
});

module.exports = { create };
