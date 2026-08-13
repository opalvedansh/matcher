/**
 * Manual mock for expo-server-sdk (uses ESM internally which Jest can't parse).
 */
class Expo {
  constructor() {}

  chunkPushNotifications(messages) {
    return [messages];
  }

  async sendPushNotificationsAsync(messages) {
    return messages.map(() => ({ status: 'ok' }));
  }
}

Expo.isExpoPushToken = (token) => typeof token === 'string' && token.startsWith('ExponentPushToken');

module.exports = { Expo };
