const { google } = require('googleapis');

/**
 * Idempotently provision a GTM container for a site, create a GA4 configuration
 * tag with an All Pages trigger, and publish the workspace.
 *
 * Steps:
 *  1. List GTM accounts — uses the first account found.
 *  2. Check for an existing container matching site.name (idempotency).
 *  3. Create container if not found.
 *  4. Get or create a workspace.
 *  5. Check if GA4 config tag already exists (idempotency).
 *  6. Create All Pages trigger + GA4 tag if not found.
 *  7. Create a container version and publish.
 *
 * @param {object} site - Site model instance
 * @param {import('google-auth-library').OAuth2Client} oauthClient
 * @param {string} measurementId - GA4 Measurement ID (G-XXXXXXXXXX)
 * @returns {Promise<{ numericContainerId: string, publicId: string, workspaceId: string }>}
 */
async function provisionGTM(site, oauthClient, measurementId) {
  const tagmanager = google.tagmanager({ version: 'v2', auth: oauthClient });

  // 1. List GTM accounts
  const accountsRes = await tagmanager.accounts.list();
  const accounts = accountsRes.data.account || [];

  if (accounts.length === 0) {
    throw new Error(
      'No GTM accounts found. Please create a Google Tag Manager account at tagmanager.google.com first.',
    );
  }

  const account = accounts[0];
  const accountId = account.accountId;
  const accountPath = `accounts/${accountId}`;

  console.log({ event: 'gtmProvisioning.account_selected', siteId: site.id, accountId, ts: new Date() });

  // 2. Check for an existing container (idempotency by name)
  const containersRes = await tagmanager.accounts.containers.list({ parent: accountPath });
  const existingContainer = (containersRes.data.container || []).find(
    (c) => c.name === site.name,
  );

  let container;
  if (existingContainer) {
    container = existingContainer;
    console.log({ event: 'gtmProvisioning.container_reused', siteId: site.id, publicId: container.publicId, ts: new Date() });
  } else {
    const createRes = await tagmanager.accounts.containers.create({
      parent: accountPath,
      requestBody: {
        name: site.name,
        usageContext: ['web'],
      },
    });
    container = createRes.data;
    console.log({ event: 'gtmProvisioning.container_created', siteId: site.id, publicId: container.publicId, ts: new Date() });
  }

  const containerId = container.containerId;
  const publicId = container.publicId; // GTM-XXXXXXX
  const containerPath = `accounts/${accountId}/containers/${containerId}`;

  // 3. Get or create a workspace
  const wsRes = await tagmanager.accounts.containers.workspaces.list({ parent: containerPath });
  let workspace = (wsRes.data.workspace || [])[0];

  if (!workspace) {
    const wsCreate = await tagmanager.accounts.containers.workspaces.create({
      parent: containerPath,
      requestBody: { name: 'Default Workspace', description: 'Auto-provisioned' },
    });
    workspace = wsCreate.data;
  }

  const workspaceId = workspace.workspaceId;
  const workspacePath = `${containerPath}/workspaces/${workspaceId}`;

  // 4. Check if GA4 config tag already exists (idempotency by tag type)
  const tagsRes = await tagmanager.accounts.containers.workspaces.tags.list({
    parent: workspacePath,
  });
  const existingTag = (tagsRes.data.tag || []).find((t) => t.type === 'gaawc');

  if (existingTag) {
    console.log({ event: 'gtmProvisioning.tag_exists', siteId: site.id, ts: new Date() });
  } else {
    // 5. Create All Pages trigger
    const triggerRes = await tagmanager.accounts.containers.workspaces.triggers.create({
      parent: workspacePath,
      requestBody: {
        name: 'All Pages',
        type: 'PAGEVIEW',
      },
    });
    const triggerId = triggerRes.data.triggerId;

    // 6. Create GA4 Configuration tag
    await tagmanager.accounts.containers.workspaces.tags.create({
      parent: workspacePath,
      requestBody: {
        name: 'GA4 Configuration',
        type: 'gaawc',
        parameter: [
          { type: 'template', key: 'measurementId', value: measurementId },
          { type: 'boolean', key: 'sendPageView', value: 'true' },
        ],
        firingTriggerId: [triggerId],
      },
    });

    console.log({ event: 'gtmProvisioning.tag_created', siteId: site.id, measurementId, ts: new Date() });
  }

  // 7. Create version and publish
  try {
    const versionRes = await tagmanager.accounts.containers.workspaces.create_version({
      path: workspacePath,
      requestBody: {
        name: 'Auto-provisioned v1',
        notes: `Automated setup for ${site.name}`,
      },
    });

    const versionId = versionRes.data.containerVersion?.containerVersionId;
    if (versionId) {
      await tagmanager.accounts.containers.versions.publish({
        path: `${containerPath}/versions/${versionId}`,
      });
      console.log({ event: 'gtmProvisioning.published', siteId: site.id, versionId, ts: new Date() });
    }
  } catch (publishErr) {
    // Publish failure is non-fatal — the container still exists with its public ID
    console.warn({
      event: 'gtmProvisioning.publish_failed',
      siteId: site.id,
      error: publishErr.message,
      ts: new Date(),
    });
  }

  return { numericContainerId: containerId, publicId, workspaceId };
}

module.exports = { provisionGTM };
