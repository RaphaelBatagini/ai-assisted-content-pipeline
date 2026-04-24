const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const auth = require('../middlewares/auth');
const { User } = require('../models');
const { createCustomer, createCheckoutSession } = require('../services/stripeService');

// POST /api/payment/checkout — requires authenticated user
router.post('/checkout', auth, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let { stripeCustomerId } = user;
    if (!stripeCustomerId) {
      stripeCustomerId = await createCustomer(user.email, user.name);
      await user.update({ stripeCustomerId });
    }

    const url = await createCheckoutSession(stripeCustomerId, user.id);
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// POST /api/payment/webhook — public, requires raw body
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    if (userId) {
      await User.update({ subscriptionStatus: 'active' }, { where: { id: userId } });
    }
  }

  res.json({ received: true });
});

module.exports = router;
