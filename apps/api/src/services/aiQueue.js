const Bull = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const aiQueue = new Bull('ai-jobs', REDIS_URL, {
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
 * Enqueue a research job for a content strategy brief.
 * @param {string} briefId
 * @param {string} siteId
 */
async function enqueueResearch(briefId, siteId) {
  const job = await aiQueue.add(
    { type: 'research', briefId, siteId },
    { jobId: `research-${briefId}-${Date.now()}` },
  );
  console.log(`[aiQueue] Enqueued research job ${job.id} for brief ${briefId}`);
  return job;
}

module.exports = { aiQueue, enqueueResearch };
