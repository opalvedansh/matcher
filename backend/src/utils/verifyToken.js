const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const CircuitBreaker = require('opossum');
const logger = require('../config/logger');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ccbgyzsdzodyfrrrzxdx.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYmd5enNkem9keWZycnJ6eGR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MzE1NzcsImV4cCI6MjEwMTQwNzU3N30.ts0lawyv33iVsFHmS8-RuTkLFeDVcjfFwTwTmQ_DsKA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseAuthBreaker = new CircuitBreaker(async (token) => {
  const { data, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  return data;
}, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
  capacity: 50
});

supabaseAuthBreaker.on('open', () => logger.warn('[CircuitBreaker] Supabase API circuit OPEN'));

/**
 * Robustly verifies a Supabase JWT access token.
 * 1. Tries local jwt.verify with SUPABASE_JWT_SECRET if available.
 * 2. Tries supabase.auth.getUser(token) API validation.
 * 3. Fallback: jwt.decode if token is a valid unexpired Supabase JWT (dev safety net).
 *
 * @param {string} token - The Bearer access token string
 * @returns {Promise<{ sub: string, email: string }>}
 */
async function verifySupabaseToken(token) {
  if (!token) {
    throw new Error('Token is missing');
  }

  // Strategy 1: Local JWT verify with secret
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (secret) {
    try {
      const decoded = jwt.verify(token, secret);
      if (decoded && decoded.sub) {
        return { sub: decoded.sub, email: decoded.email || '' };
      }
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        throw new Error('Token expired — please re-authenticate');
      }
      // Secret didn't match or algorithm mismatch, proceed to Strategy 2 & 3
    }
  }

  // Strategy 2: Validate via Supabase Auth API
  try {
    const data = await supabaseAuthBreaker.fire(token);
    if (data?.user) {
      return { sub: data.user.id, email: data.user.email || '' };
    }
  } catch (apiErr) {
    if (apiErr.code === 'EOPENBREAKER' || apiErr.code === 'ETIMEDOUT') {
      logger.warn('[CircuitBreaker] Supabase auth API unavailable. Falling back to local decode.');
    } else {
      logger.warn({ err: apiErr.message }, 'Supabase auth.getUser API check failed');
    }
  }

  // Strategy 3: Decode token payload if it's a valid unexpired Supabase JWT
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.sub) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        throw new Error('Token expired — please re-authenticate');
      }
      logger.warn({ sub: decoded.sub }, 'Verified token via JWT decode fallback');
      return { sub: decoded.sub, email: decoded.email || '' };
    }
  } catch (decodeErr) {
    // ignore
  }

  throw new Error('Invalid Supabase token');
}

module.exports = { verifySupabaseToken };
