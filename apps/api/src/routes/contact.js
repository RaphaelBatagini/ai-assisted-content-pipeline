const router = require('express').Router();
const { ContactMessage, Site } = require('../models');
const { contactLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { contact: contactSchema } = require('../validators/contact');
const { sendContactEmail } = require('../services/emailService');

// POST /api/contact
router.post('/', contactLimiter, validate(contactSchema), async (req, res, next) => {
  try {
    const { siteId, name, email, message } = req.body;
    const site = await Site.findByPk(siteId);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    await ContactMessage.create({ siteId, name, email, message });

    if (process.env.RESEND_API_KEY) {
      await sendContactEmail({
        to: site.contactEmail,
        name,
        email,
        message,
      });
    }

    res.status(201).json({ message: 'Message received' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
