const Redis = require('ioredis');

const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: false,
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
});

client.on('error', (err) => {
  console.error('[redis] Connection error:', err.message);
});

module.exports = client;
