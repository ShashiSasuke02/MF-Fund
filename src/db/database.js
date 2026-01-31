import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;

/**
 * Create MySQL connection pool
 */
function createPool() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mf_selection_app',
    waitForConnections: true,
    connectionLimit: 30,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };

  return mysql.createPool(config);
}

/**
 * Initialize MySQL database
 */
export async function initializeDatabase(retries = 30, interval = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Create connection pool if not exists
      if (!pool) {
        pool = createPool();
      }

      // Test connection
      const connection = await pool.getConnection();
      console.log(`MySQL database connected successfully (Attempt ${attempt}/${retries})`);

      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');

      // Split schema into individual statements and execute
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (statement) {
          await connection.query(statement);
        }
      }

      connection.release();
      console.log('Database schema initialized successfully');

      return pool;
    } catch (error) {
      console.error(`Database initialization error (Attempt ${attempt}/${retries}):`, error.message);

      if (attempt === retries) {
        console.error('Max retries reached. Database initialization failed.');
        throw error;
      }

      console.log(`Retrying in ${interval / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
}

/**
 * Get database pool
 */
export function getDatabase() {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query and return all results
 */
export async function query(sql, params = []) {
  const database = getDatabase();
  let retries = 3;

  while (retries > 0) {
    try {
      const [rows] = await database.query(sql, params);
      return rows;
    } catch (error) {
      if (retries === 1 || !['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(error.code)) {
        console.error('Query error:', error);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw error;
      }

      console.warn(`Database query failed (${error.code}), retrying... (${retries} left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Execute a query and return a single result
 */
export async function queryOne(sql, params = []) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Run a statement (INSERT, UPDATE, DELETE)
 */
export async function run(sql, params = []) {
  const database = getDatabase();
  let retries = 3;

  while (retries > 0) {
    try {
      const [result] = await database.query(sql, params);

      return {
        changes: result.affectedRows || 0,
        insertId: result.insertId || 0,
        lastInsertRowid: result.insertId || 0
      };
    } catch (error) {
      if (retries === 1 || !['ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST'].includes(error.code)) {
        console.error('Run error:', error);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw error;
      }

      console.warn(`Database operation failed (${error.code}), retrying... (${retries} left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
}

// Deprecated: No-op for MySQL (no manual save needed)
export function saveDatabase() {
  // MySQL automatically persists data, no action needed
}

// Export aliases for backward compatibility
export const getDb = getDatabase;
export const closeDb = closeDatabase;

// Escape function for SQL values
export function escape(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  // Escape strings for SQL
  return "'" + String(value).replace(/'/g, "''").replace(/\\/g, '\\\\') + "'";
}

export default {
  initializeDatabase,
  getDatabase,
  getDb,
  query,
  queryOne,
  run,
  closeDatabase,
  closeDb,
  saveDatabase,
  escape
};
