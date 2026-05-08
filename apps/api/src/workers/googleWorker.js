require('dotenv').config();

// Load models (needs DB connection)
require('../models');

const { googleQueue } = require('../services/googleQueue');
const { orchestrateProvisioning } = require('../services/googleProvisioningOrchestrator');

const CONCURRENCY = parseInt(process.env.GOOGLE_PROVISIONING_CONCURRENCY || '2', 10);

// ─── provision-site job ───────────────────────────────────────────────────────

googleQueue.process('provision-site', CONCURRENCY, async (job) => {
  const { siteId, userId } = job.data;
  console.log(`[googleWorker] Starting provisioning for site ${siteId}`);
  await orchestrateProvisioning(siteId, userId);
  console.log(`[googleWorker] Provisioning complete for site ${siteId}`);
});

// ─── Error / completion hooks ─────────────────────────────────────────────────

googleQueue.on('failed', (job, err) => {
  console.error(`[googleWorker] Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempt(s): ${err.message}`);
});

googleQueue.on('error', (err) => {
  console.error('[googleWorker] Queue error:', err.message);
});

console.log(`[googleWorker] Started. Concurrency: ${CONCURRENCY}`);
