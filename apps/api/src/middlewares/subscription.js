const { User } = require('../models');

async function subscription(req, res, next) {
  try {
    // If subscriptionStatus is already in the token, use it
    if (req.user && req.user.subscriptionStatus) {
      if (req.user.subscriptionStatus !== 'active') {
        return res.status(403).json({ error: 'Active subscription required' });
      }
      return next();
    }

    // Fallback: query the DB (covers tokens issued before the /refresh fix)
    const user = await User.findByPk(req.user.userId);
    if (!user || user.subscriptionStatus !== 'active') {
      return res.status(403).json({ error: 'Active subscription required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = subscription;
