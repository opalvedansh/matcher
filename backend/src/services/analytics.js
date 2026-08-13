const Mixpanel = require('mixpanel');

let mixpanel = null;

if (process.env.MIXPANEL_TOKEN) {
  mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN);
}

/**
 * Safely tracks a business event in Mixpanel.
 * If MIXPANEL_TOKEN is not set, it logs to the console for debugging.
 *
 * @param {string} userId - The ID of the user performing the action.
 * @param {string} eventName - The name of the event (e.g., 'Match_Created').
 * @param {object} properties - Additional properties to attach to the event.
 */
function trackEvent(userId, eventName, properties = {}) {
  const payload = {
    distinct_id: userId,
    ...properties,
  };

  if (mixpanel) {
    try {
      mixpanel.track(eventName, payload);
    } catch (err) {
      console.error('[Analytics] Failed to track event:', err);
    }
  } else {
    // Debug logging for local development
    console.log(`[Analytics] (Mock) Event: ${eventName} | User: ${userId} | Props:`, properties);
  }
}

module.exports = { trackEvent };
