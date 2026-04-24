require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database');

// Ensure model associations are loaded
require('./models');

const authRouter = require('./routes/auth');
const sitesRouter = require('./routes/sites');
const categoriesRouter = require('./routes/categories');
const postsRouter = require('./routes/posts');
const socialLinksRouter = require('./routes/socialLinks');
const uploadRouter = require('./routes/upload');
const contactRouter = require('./routes/contact');
const paymentRouter = require('./routes/payment');

const auth = require('./middlewares/auth');
const ownership = require('./middlewares/ownership');

const app = express();

const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.LANDING_URL  || 'http://localhost:3002',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/sites', auth, sitesRouter);
app.use(
  '/api/sites/:siteId/categories',
  auth,
  ownership,
  categoriesRouter
);
app.use(
  '/api/sites/:siteId/posts',
  auth,
  ownership,
  postsRouter
);
app.use(
  '/api/sites/:siteId/social-links',
  auth,
  ownership,
  socialLinksRouter
);
app.use('/api/upload', auth, uploadRouter);
app.use('/api/contact', contactRouter);

// Global error handler
app.use((err, req, res, next) => {
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors.map((e) => e.message),
    });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
  });
}

module.exports = app;
