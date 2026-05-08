const { OAuth2Client } = require('google-auth-library');
const { GoogleOAuthToken } = require('../models');
const { encrypt, decrypt } = require('./encryption');

// Proactively refresh if the token expires within this window
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Build a bare OAuth2 client (no credentials attached).
 * @returns {OAuth2Client}
 */
function buildOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );
}

/**
 * Returns an authenticated OAuth2Client for the given user.
 * Automatically refreshes the access token if it is expiring soon.
 * Throws if no Google connection exists for the user.
 *
 * @param {string} userId
 * @returns {Promise<OAuth2Client>}
 */
async function getValidClient(userId) {
  const record = await GoogleOAuthToken.findOne({ where: { userId } });
  if (!record) {
    throw new Error(`No Google OAuth token found for user ${userId}`);
  }

  const client = buildOAuthClient();
  let accessToken = decrypt(record.accessToken);
  const refreshToken = decrypt(record.refreshToken);
  let expiresAt = record.expiresAt;

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiresAt.getTime(),
  });

  // Proactively refresh if token is about to expire
  if (Date.now() >= expiresAt.getTime() - REFRESH_BUFFER_MS) {
    try {
      const { credentials } = await client.refreshAccessToken();
      accessToken = credentials.access_token;
      expiresAt = new Date(credentials.expiry_date || Date.now() + 3600 * 1000);

      await record.update({
        accessToken: encrypt(accessToken),
        expiresAt,
      });

      client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiresAt.getTime(),
      });

      console.log({ event: 'google.token.refreshed', userId, ts: new Date() });
    } catch (err) {
      console.error({ event: 'google.token.refresh_failed', userId, error: err.message, ts: new Date() });
      throw new Error('Google token refresh failed — user must reconnect');
    }
  }

  return client;
}

/**
 * Store (upsert) OAuth tokens for a user.
 * Only updates the refresh token if a new one is provided by Google.
 *
 * @param {string} userId
 * @param {object} credentials - Google OAuth2 credentials
 * @param {string|null} googleEmail
 */
async function upsertTokens(userId, credentials, googleEmail) {
  const expiresAt = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(Date.now() + 3600 * 1000);

  const existingRecord = await GoogleOAuthToken.findOne({ where: { userId } });

  if (existingRecord) {
    const updates = {
      accessToken: encrypt(credentials.access_token),
      expiresAt,
      ...(googleEmail ? { googleEmail } : {}),
      ...(credentials.scope ? { scopes: credentials.scope } : {}),
    };
    if (credentials.refresh_token) {
      updates.refreshToken = encrypt(credentials.refresh_token);
    }
    await existingRecord.update(updates);
  } else {
    if (!credentials.refresh_token) {
      throw new Error('No refresh token received from Google. Ensure the user grants offline access.');
    }
    await GoogleOAuthToken.create({
      userId,
      accessToken: encrypt(credentials.access_token),
      refreshToken: encrypt(credentials.refresh_token),
      expiresAt,
      googleEmail: googleEmail || null,
      scopes: credentials.scope || '',
    });
  }
}

/**
 * Revoke the user's Google tokens and delete the record.
 * Revocation is best-effort — local cleanup always proceeds.
 *
 * @param {string} userId
 */
async function revokeAndDelete(userId) {
  const record = await GoogleOAuthToken.findOne({ where: { userId } });
  if (!record) return;

  try {
    const refreshToken = decrypt(record.refreshToken);
    const client = buildOAuthClient();
    await client.revokeToken(refreshToken);
    console.log({ event: 'google.token.revoked', userId, ts: new Date() });
  } catch (err) {
    console.warn({ event: 'google.token.revoke_failed', userId, error: err.message, ts: new Date() });
  }

  await record.destroy();
}

/**
 * Check if a user has a connected Google account.
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function hasGoogleConnection(userId) {
  const count = await GoogleOAuthToken.count({ where: { userId } });
  return count > 0;
}

module.exports = { buildOAuthClient, getValidClient, upsertTokens, revokeAndDelete, hasGoogleConnection };
