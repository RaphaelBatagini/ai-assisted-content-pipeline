const Bull = require('bull');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const analyticsQueue = new Bull('analytics-events', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
});

/**
 * Enqueue an analytics event to be persisted asynchronously.
 * This function must never throw — callers rely on fire-and-forget semantics.
 * @param {object} payload
 */
async function enqueueAnalyticsEvent(payload) {
  try {
    const job = await analyticsQueue.add('track-event', payload);
    return job;
  } catch (err) {
    console.error('[analyticsQueue] Failed to enqueue event:', err.message);
  }
}

module.exports = { analyticsQueue, enqueueAnalyticsEvent };
