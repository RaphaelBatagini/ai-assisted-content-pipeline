const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const auth = require('../middlewares/auth');
const redis = require('../services/redis');
const { buildOAuthClient, upsertTokens, revokeAndDelete, hasGoogleConnection } = require('../services/googleTokenService');
const { enqueueProvisioning } = require('../services/googleQueue');
const { GoogleOAuthToken, Site } = require('../models');

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.edit',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.manage.accounts',
  'https://www.googleapis.com/auth/tagmanager.readonly',
  'email',
  'profile',
];

const STATE_TTL_SECONDS = 10 * 60; // 10 minutes
const NONCE_PREFIX = 'oauth:nonce:';

// ─── GET /api/auth/google/connect?siteId=... ──────────────────────────────────
// Returns the Google OAuth authorization URL. The client should redirect to it.
router.get('/connect', auth, async (req, res, next) => {
  try {
    const { siteId } = req.query;
    if (!siteId) return res.status(400).json({ error: 'siteId is required' });

    const site = await Site.findOne({ where: { id: siteId, userId: req.user.userId } });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    // Generate a single-use nonce stored in Redis
    const nonce = crypto.randomBytes(16).toString('hex');
    await redis.set(`${NONCE_PREFIX}${nonce}`, '1', 'EX', STATE_TTL_SECONDS);

    // Sign state as a JWT so we can verify it without a DB lookup
    const state = jwt.sign(
      { userId: req.user.userId, siteId, nonce },
      process.env.JWT_SECRET,
      { expiresIn: `${STATE_TTL_SECONDS}s` },
    );

    const oauthClient = buildOAuthClient();
    const url = oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // force refresh token on every connect
      scope: SCOPES,
      state,
    });

    console.log({ event: 'google.connect.initiated', userId: req.user.userId, siteId, ts: new Date() });

    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/auth/google/callback ────────────────────────────────────────────
// Handles the redirect from Google. Not protected by auth middleware —
// identity is established via the signed state JWT.
router.get('/callback', async (req, res, next) => {
  const { code, state, error } = req.query;
  const backofficeUrl = process.env.BACKOFFICE_URL || 'http://localhost:3000';

  if (error) {
    console.warn({ event: 'google.connect.denied', error, ts: new Date() });
    return res.redirect(`${backofficeUrl}?google_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${backofficeUrl}?google_error=missing_params`);
  }

  try {
    // 1. Verify and decode state JWT
    let payload;
    try {
      payload = jwt.verify(state, process.env.JWT_SECRET);
    } catch {
      return res.redirect(`${backofficeUrl}?google_error=invalid_state`);
    }

    const { userId, siteId, nonce } = payload;

    // 2. Validate and consume nonce (single-use CSRF protection)
    const nonceKey = `${NONCE_PREFIX}${nonce}`;
    const nonceExists = await redis.get(nonceKey);
    if (!nonceExists) {
      return res.redirect(`${backofficeUrl}?google_error=invalid_nonce`);
    }
    await redis.del(nonceKey);

    // 3. Exchange authorization code for tokens
    const oauthClient = buildOAuthClient();
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    // 4. Fetch user email via userinfo endpoint
    let googleEmail = null;
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauthClient });
      const userInfo = await oauth2.userinfo.get();
      googleEmail = userInfo.data.email;
    } catch {
      // Non-critical — continue without email
    }

    // 5. Persist tokens (encrypted)
    await upsertTokens(userId, tokens, googleEmail);

    // 6. Mark site as pending and enqueue provisioning
    await Site.update(
      { googleProvisioningStatus: 'pending', googleProvisioningError: null },
      { where: { id: siteId, userId } },
    );
    await enqueueProvisioning(siteId, userId);

    console.log({ event: 'google.connect.success', userId, siteId, googleEmail, ts: new Date() });

    // 7. Redirect back to the settings page
    res.redirect(`${backofficeUrl}/sites/${siteId}/settings?tab=seo&google_connected=1`);
  } catch (err) {
    console.error({ event: 'google.connect.error', error: err.message, ts: new Date() });
    next(err);
  }
});

// ─── GET /api/auth/google/status?siteId=... ───────────────────────────────────
router.get('/status', auth, async (req, res, next) => {
  try {
    const { siteId } = req.query;
    if (!siteId) return res.status(400).json({ error: 'siteId is required' });

    const site = await Site.findOne({ where: { id: siteId, userId: req.user.userId } });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const token = await GoogleOAuthToken.findOne({ where: { userId: req.user.userId } });

    res.json({
      connected: !!token,
      googleEmail: token?.googleEmail || null,
      provisioningStatus: site.googleProvisioningStatus,
      provisioningError: site.googleProvisioningError,
      gaTrackingId: site.gaTrackingId,
      gaPropertyId: site.gaPropertyId,
      gtmContainerId: site.gtmContainerId,
    });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/auth/google/disconnect?siteId=... ────────────────────────────
router.delete('/disconnect', auth, async (req, res, next) => {
  try {
    const { siteId } = req.query;
    if (!siteId) return res.status(400).json({ error: 'siteId is required' });

    const site = await Site.findOne({ where: { id: siteId, userId: req.user.userId } });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    // Revoke Google tokens and delete the record
    await revokeAndDelete(req.user.userId);

    // Reset all provisioned data on the site
    await site.update({
      googleProvisioningStatus: 'idle',
      googleProvisioningError: null,
      gaTrackingId: null,
      gaPropertyId: null,
      gaStreamId: null,
      gtmContainerId: null,
      gtmNumericContainerId: null,
      gtmWorkspaceId: null,
    });

    console.log({ event: 'google.disconnect', userId: req.user.userId, siteId, ts: new Date() });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/google/retry?siteId=... ───────────────────────────────────
router.post('/retry', auth, async (req, res, next) => {
  try {
    const { siteId } = req.query;
    if (!siteId) return res.status(400).json({ error: 'siteId is required' });

    const site = await Site.findOne({ where: { id: siteId, userId: req.user.userId } });
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const connected = await hasGoogleConnection(req.user.userId);
    if (!connected) return res.status(400).json({ error: 'Google account not connected' });

    await site.update({ googleProvisioningStatus: 'pending', googleProvisioningError: null });
    await enqueueProvisioning(siteId, req.user.userId);

    console.log({ event: 'google.provision.retry', userId: req.user.userId, siteId, ts: new Date() });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
