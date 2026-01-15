/**
 * Migration Script: SQLite to MySQL
 * 
 * This script migrates data from the existing SQLite database (data/mfselection.db)
 * to a MySQL database while preserving all relationships and data integrity.
 * 
 * Prerequisites:
 * 1. MySQL server must be running
 * 2. Database 'mfselection' must be created in MySQL
 * 3. MySQL credentials must be configured in .env file
 * 4. SQLite database file must exist at data/mfselection.db
 * 
 * Usage: node scripts/migrate-sqlite-to-mysql.js
 */

import initSqlJs from 'sql.js';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_DB_PATH = path.join(__dirname, '../data/mfselection.db');

// Tables to migrate in order (respecting foreign key dependencies)
const TABLES_TO_MIGRATE = [
  { name: 'amc_master', orderBy: 'display_order' },
  { name: 'api_cache', orderBy: 'cache_key' },
  { name: 'users', orderBy: 'id' },
  { name: 'demo_accounts', orderBy: 'id' },
  { name: 'transactions', orderBy: 'id' },
  { name: 'holdings', orderBy: 'id' }
];

async function connectMySQL() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mfselection',
    multipleStatements: true
  });
  
  console.log('✓ Connected to MySQL database');
  return connection;
}

async function loadSQLiteDatabase() {
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    throw new Error(`SQLite database not found at: ${SQLITE_DB_PATH}`);
  }
  
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(SQLITE_DB_PATH);
  const db = new SQL.Database(buffer);
  
  console.log('✓ Loaded SQLite database');
  return db;
}

function getSQLiteData(sqliteDb, tableName) {
  const stmt = sqliteDb.prepare(`SELECT * FROM ${tableName}`);
  const rows = [];
  
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  
  return rows;
}

async function migrateTable(sqliteDb, mysqlConn, tableInfo) {
  const tableName = tableInfo.name;
  console.log(`\nMigrating table: ${tableName}`);
  
  // Get data from SQLite
  const rows = getSQLiteData(sqliteDb, tableName);
  
  if (rows.length === 0) {
    console.log(`  ⊘ No data to migrate for ${tableName}`);
    return { table: tableName, migrated: 0, skipped: 0 };
  }
  
  console.log(`  Found ${rows.length} rows in SQLite`);
  
  // Clear existing data in MySQL table
  await mysqlConn.query(`DELETE FROM ${tableName}`);
  console.log(`  Cleared existing data in MySQL ${tableName}`);
  
  let migrated = 0;
  let skipped = 0;
  
  // Get column names from first row
  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => '?').join(', ');
  const columnList = columns.join(', ');
  
  // Prepare INSERT statement
  const insertSQL = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})`;
  
  // Insert data in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    for (const row of batch) {
      try {
        const values = columns.map(col => row[col]);
        await mysqlConn.execute(insertSQL, values);
        migrated++;
      } catch (error) {
        console.error(`  ✗ Error migrating row:`, error.message);
        console.error(`    Row data:`, row);
        skipped++;
      }
    }
    
    if ((i + BATCH_SIZE) % 500 === 0 || (i + BATCH_SIZE) >= rows.length) {
      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} rows`);
    }
  }
  
  console.log(`  ✓ Migrated ${migrated} rows (${skipped} skipped)`);
  
  // Verify counts match
  const [countResult] = await mysqlConn.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  const mysqlCount = countResult[0].count;
  
  if (mysqlCount === migrated) {
    console.log(`  ✓ Verification passed: ${mysqlCount} rows in MySQL`);
  } else {
    console.warn(`  ⚠ Warning: Count mismatch! SQLite: ${rows.length}, MySQL: ${mysqlCount}, Migrated: ${migrated}`);
  }
  
  return { table: tableName, migrated, skipped, totalSource: rows.length, totalDestination: mysqlCount };
}

async function verifyMigration(sqliteDb, mysqlConn) {
  console.log('\n=== Verifying Migration ===');
  
  const results = [];
  
  for (const tableInfo of TABLES_TO_MIGRATE) {
    const tableName = tableInfo.name;
    
    // Get counts from both databases
    const sqliteRows = getSQLiteData(sqliteDb, tableName);
    const sqliteCount = sqliteRows.length;
    
    const [mysqlResult] = await mysqlConn.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const mysqlCount = mysqlResult[0].count;
    
    const status = sqliteCount === mysqlCount ? '✓' : '✗';
    console.log(`${status} ${tableName}: SQLite=${sqliteCount}, MySQL=${mysqlCount}`);
    
    results.push({
      table: tableName,
      sqliteCount,
      mysqlCount,
      match: sqliteCount === mysqlCount
    });
  }
  
  const allMatch = results.every(r => r.match);
  
  if (allMatch) {
    console.log('\n✓ All tables verified successfully!');
  } else {
    console.log('\n✗ Some tables have mismatched counts. Please review.');
  }
  
  return results;
}

async function main() {
  console.log('=== SQLite to MySQL Migration ===\n');
  
  let sqliteDb = null;
  let mysqlConn = null;
  
  try {
    // Load databases
    sqliteDb = await loadSQLiteDatabase();
    mysqlConn = await connectMySQL();
    
    // Disable foreign key checks during migration
    await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✓ Disabled foreign key checks');
    
    // Migrate each table
    const migrationResults = [];
    for (const tableInfo of TABLES_TO_MIGRATE) {
      const result = await migrateTable(sqliteDb, mysqlConn, tableInfo);
      migrationResults.push(result);
    }
    
    // Re-enable foreign key checks
    await mysqlConn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✓ Re-enabled foreign key checks');
    
    // Verify migration
    const verificationResults = await verifyMigration(sqliteDb, mysqlConn);
    
    // Print summary
    console.log('\n=== Migration Summary ===');
    console.log('Table                 | Migrated | Skipped | Source | Destination');
    console.log('----------------------|----------|---------|--------|------------');
    
    migrationResults.forEach(result => {
      const tableName = result.table.padEnd(20);
      const migrated = String(result.migrated).padStart(8);
      const skipped = String(result.skipped).padStart(7);
      const source = String(result.totalSource).padStart(6);
      const dest = String(result.totalDestination).padStart(11);
      console.log(`${tableName} | ${migrated} | ${skipped} | ${source} | ${dest}`);
    });
    
    const totalMigrated = migrationResults.reduce((sum, r) => sum + r.migrated, 0);
    const totalSkipped = migrationResults.reduce((sum, r) => sum + r.skipped, 0);
    
    console.log('\n✓ Migration completed successfully!');
    console.log(`  Total rows migrated: ${totalMigrated}`);
    console.log(`  Total rows skipped: ${totalSkipped}`);
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    if (sqliteDb) {
      sqliteDb.close();
      console.log('\n✓ Closed SQLite database');
    }
    
    if (mysqlConn) {
      await mysqlConn.end();
      console.log('✓ Closed MySQL connection');
    }
  }
}

// Run migration
main().catch(console.error);
