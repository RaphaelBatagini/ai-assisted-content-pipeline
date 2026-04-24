const Bull = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const buildQueue = new Bull('site-builds', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Enqueue a site build job.
 * @param {string} siteId
 * @param {string} trigger - e.g. 'content_change' | 'settings_change'
 */
async function enqueueBuild(siteId, trigger = 'content_change') {
  const job = await buildQueue.add(
    { siteId, trigger },
    {
      jobId: `${siteId}-${Date.now()}`,
    },
  );
  console.log(`[buildQueue] Enqueued build job ${job.id} for site ${siteId} (trigger: ${trigger})`);
  return job;
}

module.exports = { buildQueue, enqueueBuild };
