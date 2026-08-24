const { ApifyClient } = require('apify-client');
const logger = require('../config/logger');

// ─── Apify Client ────────────────────────────────────────────────
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
let client = null;

function getClient() {
  if (!client) {
    if (!APIFY_TOKEN) {
      throw new Error('APIFY_API_TOKEN is not configured');
    }
    client = new ApifyClient({ token: APIFY_TOKEN });
  }
  return client;
}

// Actor IDs — using the well-known Apify community actors
const PROFILE_ACTOR_ID = 'apify/instagram-profile-scraper';

/**
 * Scrape an Instagram profile and return normalized stats.
 *
 * @param {string} handle - Instagram username (without @)
 * @returns {Promise<{followers: number, engagement_rate: number, avg_views: number, bio: string, avatar_url: string} | null>}
 */
async function syncInstagramProfile(handle) {
  const apify = getClient();

  logger.info({ handle }, 'Starting Apify Instagram profile scrape');

  try {
    // Run the Instagram profile scraper actor
    const run = await apify.actor(PROFILE_ACTOR_ID).call(
      {
        usernames: [handle],
      },
      {
        timeout: 120,          // max 2 minutes
        memory: 256,           // 256 MB (minimum for this actor)
        waitSecs: 120,         // wait up to 2 minutes for completion
      }
    );

    // Fetch the dataset items from the completed run
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      logger.warn({ handle }, 'Apify returned no data for Instagram handle');
      return null;
    }

    const profile = items[0];
    logger.info({ handle, followersCount: profile.followersCount }, 'Apify scrape completed');

    // ── Compute engagement rate ──────────────────────────────────
    // engagement_rate = (avg likes + avg comments) / followers * 100
    let engagementRate = 0;
    if (profile.followersCount > 0) {
      const avgLikes = profile.avgLikes || profile.averageLikes || 0;
      const avgComments = profile.avgComments || profile.averageComments || 0;
      engagementRate = parseFloat(
        (((avgLikes + avgComments) / profile.followersCount) * 100).toFixed(2)
      );
    }

    // ── Compute average reel/video views ─────────────────────────
    // Some actors return latestPosts with video view counts
    let avgViews = 0;
    if (profile.latestPosts && profile.latestPosts.length > 0) {
      const videoPosts = profile.latestPosts.filter(
        (p) => p.videoViewCount != null && p.videoViewCount > 0
      );
      if (videoPosts.length > 0) {
        const totalViews = videoPosts.reduce((sum, p) => sum + p.videoViewCount, 0);
        avgViews = Math.round(totalViews / videoPosts.length);
      }
    }

    // ── Extract Reels/Top Videos ─────────────────────────────────
    let reels = [];
    if (profile.latestPosts && profile.latestPosts.length > 0) {
      const videoPosts = profile.latestPosts.filter(
        (p) => p.videoViewCount != null && p.videoViewCount > 0
      );
      // Grab top 3 recent videos
      reels = videoPosts.slice(0, 3).map(p => ({
        id: p.shortCode || String(p.id),
        url: p.url || (p.shortCode ? `https://www.instagram.com/reel/${p.shortCode}/` : ''),
        thumbnail_url: p.displayUrl || p.thumbnailUrl || '',
        views: String(p.videoViewCount)
      }));
    }

    return {
      followers: profile.followersCount || 0,
      engagement_rate: engagementRate,
      avg_views: avgViews,
      bio: profile.biography || null,
      avatar_url: profile.profilePicUrlHD || profile.profilePicUrl || null,
      reels,
    };
  } catch (err) {
    logger.error({ handle, error: err.message, stack: err.stack }, 'Apify Instagram scrape failed');
    return null;
  }
}

/**
 * Search Instagram profiles using Apify's instagram-search-scraper
 *
 * @param {string} query - The search string
 * @returns {Promise<string[]>} Array of usernames
 */
async function searchInstagramProfiles(query) {
  const apify = getClient();
  logger.info({ query }, 'Starting Apify Instagram search scrape');

  try {
    const run = await apify.actor('apify/instagram-search-scraper').call(
      {
        search: query,
        searchType: "user",
        resultsType: "details", // need details or it might not return items nicely
        searchLimit: 6
      },
      {
        timeout: 60,          
        memory: 256,
        waitSecs: 60,         
      }
    );

    const { items } = await apify.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return [];
    }
    
    return items.map(item => item.username).filter(Boolean);
  } catch (err) {
    logger.error({ query, error: err.message }, 'Apify Instagram search failed');
    return [];
  }
}

module.exports = { syncInstagramProfile, searchInstagramProfiles };
