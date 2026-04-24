const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createCustomer(email, name) {
  const customer = await stripe.customers.create({ email, name });
  return customer.id;
}

async function createCheckoutSession(stripeCustomerId, userId) {
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    client_reference_id: String(userId),
    success_url: `${process.env.FRONTEND_URL}/payment/success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
  });
  return session.url;
}

module.exports = { createCustomer, createCheckoutSession };
