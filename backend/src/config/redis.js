const logger = require('./logger');

let redisClient = null;

// Only create a real Redis client if REDIS_URL is explicitly set,
// or if we're NOT in development/test mode.
// This prevents the app from crashing when Redis isn't installed locally.
const shouldUseRedis =
  process.env.NODE_ENV === 'test'
    ? false
    : !!process.env.REDIS_URL;

if (process.env.NODE_ENV === 'test') {
  const Redis = require('ioredis-mock');
  redisClient = new Redis();
} else if (shouldUseRedis) {
  const Redis = require('ioredis');
  redisClient = new Redis(process.env.REDIS_URL, {
    family: 0, // Railway internal networking requires IPv6 (family 0 allows both IPv4 and IPv6)
    maxRetriesPerRequest: 3,          // fail fast instead of 20 retries
    retryStrategy: (times) => {
      if (times > 5) return null;     // stop retrying after 5 attempts
      return Math.min(times * 200, 2000);
    },
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err.message);
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });
} else {
  // No Redis in development — log a warning once and export null.
  // Rate limiters and socket adapter will gracefully fall back to in-memory.
  logger.warn('Redis not configured — using in-memory fallback for rate limiting. Set REDIS_URL for production.');
}

module.exports = redisClient;
