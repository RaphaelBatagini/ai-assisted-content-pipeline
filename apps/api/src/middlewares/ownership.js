const { Site } = require('../models');

async function ownership(req, res, next) {
  const { siteId } = req.params;
  try {
    const site = await Site.findOne({ where: { id: siteId, userId: req.user.userId } });
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }
    req.site = site;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = ownership;
