import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'mfselection.db');

let db = null;

/**
 * Initialize SQLite database with sql.js (pure JavaScript implementation)
 */
export async function initializeDatabase() {
  try {
    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    // Initialize SQL.js
    const SQL = await initSqlJs();
    
    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('Database loaded from file');
    } else {
      db = new SQL.Database();
      console.log('New database created');
    }

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Execute schema statements
    db.run(schema);
    
    // Save the database
    saveDatabase();

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

/**
 * Save database to file
 */
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

/**
 * Get database instance
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Execute a query and return all results
 */
export function query(sql, params = []) {
  const database = getDatabase();
  try {
    const stmt = database.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

/**
 * Execute a query and return a single result
 */
export function queryOne(sql, params = []) {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Run a statement (INSERT, UPDATE, DELETE)
 */
export function run(sql, params = []) {
  const database = getDatabase();
  try {
    // Prepare and bind parameters
    const stmt = database.prepare(sql);
    stmt.bind(params);
    
    // Execute the statement
    stmt.step();
    stmt.free();
    
    // Get number of changes and last insert row id
    const changes = database.getRowsModified();
    const lastIdResult = database.exec("SELECT last_insert_rowid()");
    const lastInsertRowid = lastIdResult[0]?.values[0]?.[0] || 0;
    
    // Save database after successful execution
    saveDatabase();
    
    return {
      changes,
      lastInsertRowid
    };
  } catch (error) {
    console.error('Run error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

// Export aliases for backward compatibility
export const getDb = getDatabase;
export const closeDb = closeDatabase;

export default {
  initializeDatabase,
  getDatabase,
  getDb,
  query,
  queryOne,
  run,
  closeDatabase,
  closeDb,
  saveDatabase
};
