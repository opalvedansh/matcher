const { Expo } = require('expo-server-sdk');

// Expo Client
const expo = new Expo();

// Redis config — only used if Redis is available
const hasRedis = !!(process.env.REDIS_URL || process.env.REDIS_HOST);

let pushQueue = null;
let pushWorker = null;

if (hasRedis) {
  const { Queue, Worker } = require('bullmq');
  const IORedis = require('ioredis');

  // BullMQ requires maxRetriesPerRequest: null per the BullMQ docs.
  // We create a dedicated connection so BullMQ doesn't share state with
  // the rate-limiter / socket adapter clients.
  const redisUrl = process.env.REDIS_URL;
  const connectionOpts = redisUrl
    ? { maxRetriesPerRequest: null, family: 0, enableOfflineQueue: false }
    : {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: null,
        family: 0,
        enableOfflineQueue: false,
      };

  const bullMqConnection = redisUrl
    ? new IORedis(redisUrl, connectionOpts)
    : new IORedis(connectionOpts);

  // ── Error handler — prevents unhandled 'error' event crashes ──────
  bullMqConnection.on('error', (err) => {
    console.error('[Queue] Redis connection error:', err.message);
  });

  bullMqConnection.on('connect', () => {
    console.log('[Queue] Redis connected for BullMQ');
  });

  try {
    // Queue for Push Notifications
    pushQueue = new Queue('PushNotifications', {
      connection: bullMqConnection,
    });

    // Worker that processes the background jobs
    pushWorker = new Worker(
      'PushNotifications',
      async (job) => {
        const { token, title, body, data } = job.data;

        // Check if token is valid
        if (!Expo.isExpoPushToken(token)) {
          console.error(`[BullMQ] Invalid push token: ${token}`);
          return;
        }

        const message = {
          to: token,
          sound: 'default',
          title,
          body,
          data,
        };

        try {
          const tickets = await expo.sendPushNotificationsAsync([message]);
          console.log('[BullMQ] Push sent successfully:', tickets);
        } catch (error) {
          console.error('[BullMQ] Expo API Error:', error.message);
          throw error; // Let BullMQ retry
        }
      },
      {
        connection: bullMqConnection,
        concurrency: 5, // process up to 5 pushes concurrently
      }
    );

    pushWorker.on('failed', (job, err) => {
      console.error(`[BullMQ] Job ${job?.id} failed after retries:`, err.message);
    });

    pushWorker.on('error', (err) => {
      console.error('[BullMQ] Worker error:', err.message);
    });

    console.log('[Queue] BullMQ push notification queue initialized');
  } catch (err) {
    console.error('[Queue] Failed to initialize BullMQ — push notifications will be sent inline:', err.message);
    pushQueue = null;
    pushWorker = null;
  }
} else {
  console.warn('[Queue] Redis not available — push notification queue disabled. Notifications will be sent inline.');
}

module.exports = { pushQueue };
