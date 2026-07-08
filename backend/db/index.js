const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'signage_user',
  password: process.env.DB_PASSWORD || 'signage_password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'signage_db',
});

// Log connection info (without password)
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Query wrapper with error handling
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Executed query in ${duration}ms`);
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a client by ID
 */
async function getClient(clientId) {
  const res = await query('SELECT * FROM clients WHERE id = $1', [clientId]);
  return res.rows[0];
}

/**
 * Get all orders for a client
 */
async function getClientOrders(clientId) {
  const res = await query(
    'SELECT * FROM orders WHERE client_id = $1 ORDER BY created_at DESC',
    [clientId]
  );
  return res.rows;
}

/**
 * Get order by ID
 */
async function getOrder(orderId) {
  const res = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  return res.rows[0];
}

module.exports = {
  pool,
  query,
  getClient,
  getClientOrders,
  getOrder,
};
