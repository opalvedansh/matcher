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
  
  // BullMQ requires maxRetriesPerRequest: null, and passing a URL directly
  // creates independent connections so workers don't block Express rate limiters.
  const bullMqConnection = process.env.REDIS_URL 
    ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null, family: 0 })
    : new IORedis({ host: process.env.REDIS_HOST || '127.0.0.1', port: process.env.REDIS_PORT || 6379, maxRetriesPerRequest: null, family: 0 });

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
        console.error('[BullMQ] Expo API Error:', error);
        throw error; // Let BullMQ retry
      }
    },
    {
      connection: bullMqConnection,
      concurrency: 5, // process up to 5 pushes concurrently
    }
  );

  pushWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job.id} failed after retries:`, err);
  });

  console.log('[Queue] BullMQ push notification queue initialized');
} else {
  console.warn('[Queue] Redis not available — push notification queue disabled. Notifications will be sent inline.');
}

module.exports = { pushQueue };
