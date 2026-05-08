const Bull = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const googleQueue = new Bull('google-provisioning', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Enqueue a Google provisioning job for a site.
 * @param {string} siteId
 * @param {string} userId
 */
async function enqueueProvisioning(siteId, userId) {
  const job = await googleQueue.add('provision-site', { siteId, userId });
  console.log(`[googleQueue] Enqueued provisioning job ${job.id} for site ${siteId}`);
  return job;
}

module.exports = { googleQueue, enqueueProvisioning };
