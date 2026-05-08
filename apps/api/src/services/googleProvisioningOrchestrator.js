const { getValidClient } = require('./googleTokenService');
const { provisionGA4 } = require('./ga4ProvisioningService');
const { provisionGTM } = require('./gtmProvisioningService');
const { Site } = require('../models');
const { enqueueBuild } = require('./buildQueue');

/**
 * Orchestrate full Google provisioning for a site:
 *   1. Provision GA4 property + data stream
 *   2. Provision GTM container + GA4 tag + publish
 *   3. Persist all IDs to the site record
 *   4. Mark provisioning as ready and trigger a site rebuild
 *
 * On any failure the site is marked as 'error' and the error rethrown
 * so the Bull worker can retry.
 *
 * Idempotent — safe to call multiple times; GA4 and GTM services
 * detect and reuse existing resources.
 *
 * @param {string} siteId
 * @param {string} userId
 */
async function orchestrateProvisioning(siteId, userId) {
  const site = await Site.findByPk(siteId);
  if (!site) throw new Error(`Site ${siteId} not found`);

  await site.update({
    googleProvisioningStatus: 'provisioning',
    googleProvisioningError: null,
  });

  console.log({ event: 'google.provision.start', siteId, userId, ts: new Date() });

  try {
    const oauthClient = await getValidClient(userId);

    // Step 1 — GA4
    const { propertyId, streamId, measurementId } = await provisionGA4(site, oauthClient);

    await site.update({
      gaPropertyId: propertyId,
      gaTrackingId: measurementId,
      gaStreamId: streamId,
    });

    console.log({ event: 'google.provision.ga4.done', siteId, propertyId, measurementId, ts: new Date() });

    // Step 2 — GTM
    const { numericContainerId, publicId, workspaceId } = await provisionGTM(
      site,
      oauthClient,
      measurementId,
    );

    await site.update({
      gtmContainerId: publicId,
      gtmNumericContainerId: numericContainerId,
      gtmWorkspaceId: workspaceId,
    });

    console.log({ event: 'google.provision.gtm.done', siteId, publicId, ts: new Date() });

    // Step 3 — Mark ready + rebuild
    await site.update({ googleProvisioningStatus: 'ready' });
    await enqueueBuild(siteId, 'google-provisioning');

    console.log({ event: 'google.provision.complete', siteId, ts: new Date() });
  } catch (err) {
    console.error({ event: 'google.provision.error', siteId, error: err.message, ts: new Date() });

    await site.update({
      googleProvisioningStatus: 'error',
      googleProvisioningError: err.message,
    });

    throw err; // rethrow so Bull can retry with exponential backoff
  }
}

module.exports = { orchestrateProvisioning };
