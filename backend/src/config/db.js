const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep SSL enabled for production (e.g. Supabase, Heroku, Railway)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 100,             // high concurrency for 100k scale
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000, // fail fast under load
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error (recovered natively):', err.message);
});

/**
 * Run a parameterized query.
 * @param {string} text  - SQL query with $1, $2 placeholders
 * @param {Array}  params - Query parameters
 */
const query = (text, params) => pool.query(text, params);

/**
 * Grab a dedicated client for transactions.
 * Always call client.release() in a finally block.
 */
const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
