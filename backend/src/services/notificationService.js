const db = require('../config/db');
const { pushQueue } = require('../config/queue');

// Maximum IDs to batch in a single DB query / BullMQ addBulk call
const CHUNK_SIZE = 500;

/**
 * Splits an array into chunks of at most `size`.
 * @template T
 * @param {T[]} arr
 * @param {number} size
 * @returns {T[][]}
 */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Sends push notifications to ONE OR MANY users in as few DB round trips as possible.
 *
 * - Fetches all push tokens in a single batched SELECT … WHERE id = ANY($1)
 * - Enqueues all messages with a single BullMQ addBulk() call per chunk
 *
 * @param {Array<{ userId: string, title: string, body: string, data?: object }>} notifications
 */
async function sendBulkNotifications(notifications) {
  if (!notifications.length) return;

  try {
    // ── 1. Gather unique user IDs ─────────────────────────────────────
    const userIds = [...new Set(notifications.map(n => n.userId))];

    // ── 2. Batch-fetch all push tokens in ONE round trip ─────────────
    const { rows } = await db.query(
      `SELECT id, expo_push_token
       FROM users
       WHERE id = ANY($1) AND expo_push_token IS NOT NULL`,
      [userIds]
    );

    // Build userId → token map
    const tokenMap = new Map(rows.map(r => [r.id, r.expo_push_token]));

    if (!pushQueue) {
      console.warn('[Push] BullMQ unavailable (no Redis). Notifications skipped.');
      return;
    }

    // ── 3. Build BullMQ jobs, skipping users with no token ────────────
    const jobs = notifications
      .filter(n => tokenMap.has(n.userId))
      .map(n => ({
        name: 'send_push',
        data: {
          token: tokenMap.get(n.userId),
          title: n.title,
          body:  n.body,
          data:  n.data || {},
        },
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        },
      }));

    if (!jobs.length) {
      console.log('[Push] No tokens found for recipients — skipping.');
      return;
    }

    // ── 4. Enqueue in chunks to avoid oversized BullMQ payloads ───────
    for (const jobChunk of chunk(jobs, CHUNK_SIZE)) {
      await pushQueue.addBulk(jobChunk);
    }
  } catch (err) {
    console.error('[Push] Failed to queue bulk notifications:', err);
  }
}

/**
 * Sends a push notification to a single user.
 * Internally delegates to sendBulkNotifications (1-element batch).
 *
 * @param {string} userId
 * @param {string} title
 * @param {string} body
 * @param {object} [data={}]
 */
async function sendNotification(userId, title, body, data = {}) {
  await sendBulkNotifications([{ userId, title, body, data }]);
}

/**
 * Notifies BOTH users when a match is formed — single DB round trip for both tokens.
 *
 * @param {{ swiperId: string, swiperName: string, swipedId: string, swipedName: string }} params
 */
async function sendMatchNotifications({ swiperId, swiperName, swipedId, swipedName }) {
  await sendBulkNotifications([
    {
      userId: swipedId,
      title:  'New Match! 🎉',
      body:   `You matched with ${swiperName}. Say hi!`,
      data:   { type: 'new_match' },
    },
    {
      userId: swiperId,
      title:  'New Match! 🎉',
      body:   `You matched with ${swipedName}. Say hi!`,
      data:   { type: 'new_match' },
    },
  ]);
}

/**
 * Legacy single-user match notification (kept for backwards compatibility).
 */
async function sendMatchNotification(userId, matchName) {
  await sendNotification(userId, 'New Match! 🎉', `You matched with ${matchName}. Say hi!`, { type: 'new_match' });
}

/**
 * Triggers when a chat message is received.
 * Looks up the sender's name in a UNION query then sends via sendBulkNotifications.
 */
async function sendChatNotification(receiverId, senderId, messageContent) {
  try {
    // Fetch sender name — single query
    const { rows } = await db.query(
      `SELECT name FROM (
         SELECT name FROM brand_profiles     WHERE user_id = $1
         UNION
         SELECT name FROM influencer_profiles WHERE user_id = $1
       ) AS profiles LIMIT 1`,
      [senderId]
    );
    const senderName = rows[0]?.name || 'Someone';

    await sendBulkNotifications([{
      userId: receiverId,
      title:  `New message from ${senderName}`,
      body:   messageContent,
      data:   { type: 'new_message', senderId },
    }]);
  } catch (err) {
    console.error('[Push] Error sending chat notification:', err);
  }
}

module.exports = {
  sendNotification,
  sendBulkNotifications,
  sendMatchNotification,
  sendMatchNotifications,
  sendChatNotification,
};
