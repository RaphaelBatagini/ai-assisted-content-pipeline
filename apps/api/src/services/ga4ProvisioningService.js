const { google } = require('googleapis');

/**
 * Idempotently provision a GA4 property and web data stream for a site.
 *
 * Steps:
 *  1. List GA4 accounts — uses the first account found.
 *  2. Check for an existing property matching site.name (idempotency).
 *  3. Create property if not found.
 *  4. Check for an existing web data stream (idempotency).
 *  5. Create stream if not found.
 *
 * @param {object} site - Site model instance
 * @param {import('google-auth-library').OAuth2Client} oauthClient
 * @returns {Promise<{ propertyId: string, streamId: string, measurementId: string }>}
 */
async function provisionGA4(site, oauthClient) {
  const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: oauthClient });

  // 1. List accounts
  const accountsRes = await analyticsAdmin.accounts.list();
  const accounts = accountsRes.data.accounts || [];

  if (accounts.length === 0) {
    throw new Error(
      'No Google Analytics accounts found. Please create a GA account at analytics.google.com first.',
    );
  }

  const account = accounts[0];
  const accountName = account.name; // e.g. 'accounts/123456'

  console.log({
    event: 'ga4Provisioning.account_selected',
    siteId: site.id,
    account: accountName,
    ts: new Date(),
  });

  // 2. Check for an existing property (idempotency by display name)
  const propsRes = await analyticsAdmin.properties.list({
    filter: `parent:${accountName}`,
  });
  const existingProperty = (propsRes.data.properties || []).find(
    (p) => p.displayName === site.name,
  );

  let propertyName;
  if (existingProperty) {
    propertyName = existingProperty.name;
    console.log({ event: 'ga4Provisioning.property_reused', siteId: site.id, propertyName, ts: new Date() });
  } else {
    const createRes = await analyticsAdmin.properties.create({
      requestBody: {
        parent: accountName,
        displayName: site.name,
        timeZone: 'America/Sao_Paulo',
        currencyCode: 'BRL',
        industryCategory: 'UNSPECIFIED',
      },
    });
    propertyName = createRes.data.name;
    console.log({ event: 'ga4Provisioning.property_created', siteId: site.id, propertyName, ts: new Date() });
  }

  // propertyName format: 'properties/123456'
  const propertyId = propertyName.split('/')[1];

  // 3. Check for an existing web data stream (idempotency)
  const streamsRes = await analyticsAdmin.properties.dataStreams.list({ parent: propertyName });
  const existingStream = (streamsRes.data.dataStreams || []).find(
    (s) => s.type === 'WEB_DATA_STREAM',
  );

  let streamId;
  let measurementId;

  if (existingStream) {
    streamId = existingStream.name.split('/').pop();
    measurementId = existingStream.webStreamData?.measurementId;
    console.log({ event: 'ga4Provisioning.stream_reused', siteId: site.id, streamId, measurementId, ts: new Date() });
  } else {
    const streamRes = await analyticsAdmin.properties.dataStreams.create({
      parent: propertyName,
      requestBody: {
        type: 'WEB_DATA_STREAM',
        displayName: site.name,
        webStreamData: {
          defaultUri: `https://${site.slug}.${process.env.SITE_BASE_DOMAIN || 'example.com'}`,
        },
      },
    });
    streamId = streamRes.data.name.split('/').pop();
    measurementId = streamRes.data.webStreamData?.measurementId;
    console.log({ event: 'ga4Provisioning.stream_created', siteId: site.id, streamId, measurementId, ts: new Date() });
  }

  if (!measurementId) {
    throw new Error('GA4 stream created but measurement ID was not returned by Google.');
  }

  return { propertyId, streamId, measurementId };
}

module.exports = { provisionGA4 };
