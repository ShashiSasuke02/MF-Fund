/**
 * Reset Test Data Script
 * This script deletes all users, demo accounts, transactions, and holdings
 * Useful for testing with a clean slate
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/mfselection.db');

async function resetTestData() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file not found at:', DB_PATH);
      return;
    }

    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);

    console.log('='.repeat(80));
    console.log('RESETTING TEST DATA');
    console.log('='.repeat(80));

    // Count existing records before deletion
    const userCount = db.exec('SELECT COUNT(*) as count FROM users')[0]?.values[0]?.[0] || 0;
    const demoCount = db.exec('SELECT COUNT(*) as count FROM demo_accounts')[0]?.values[0]?.[0] || 0;
    const txCount = db.exec('SELECT COUNT(*) as count FROM transactions')[0]?.values[0]?.[0] || 0;
    const holdingCount = db.exec('SELECT COUNT(*) as count FROM holdings')[0]?.values[0]?.[0] || 0;

    console.log('\n📊 Current Records:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Demo Accounts: ${demoCount}`);
    console.log(`   Transactions: ${txCount}`);
    console.log(`   Holdings: ${holdingCount}`);

    if (userCount === 0 && txCount === 0 && holdingCount === 0) {
      console.log('\n✓ Database is already clean!');
      db.close();
      return;
    }

    console.log('\n🗑️  Deleting all test data...');

    // Delete in correct order (respecting foreign keys)
    db.run('DELETE FROM transactions');
    console.log('   ✅ Deleted all transactions');

    db.run('DELETE FROM holdings');
    console.log('   ✅ Deleted all holdings');

    db.run('DELETE FROM demo_accounts');
    console.log('   ✅ Deleted all demo accounts');

    db.run('DELETE FROM users');
    console.log('   ✅ Deleted all users');

    // Reset auto-increment counters
    db.run('DELETE FROM sqlite_sequence WHERE name IN ("users", "demo_accounts", "transactions", "holdings")');
    console.log('   ✅ Reset auto-increment counters');

    // Save database
    const data = db.export();
    const bufferOut = Buffer.from(data);
    fs.writeFileSync(DB_PATH, bufferOut);
    console.log('\n💾 Database saved successfully');

    // Verify deletion
    const newUserCount = db.exec('SELECT COUNT(*) as count FROM users')[0]?.values[0]?.[0] || 0;
    const newTxCount = db.exec('SELECT COUNT(*) as count FROM transactions')[0]?.values[0]?.[0] || 0;
    const newHoldingCount = db.exec('SELECT COUNT(*) as count FROM holdings')[0]?.values[0]?.[0] || 0;

    console.log('\n📊 After Reset:');
    console.log(`   Users: ${newUserCount}`);
    console.log(`   Transactions: ${newTxCount}`);
    console.log(`   Holdings: ${newHoldingCount}`);

    console.log('\n='.repeat(80));
    console.log('✅ RESET COMPLETE - Database is clean and ready for testing!');
    console.log('='.repeat(80));

    db.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetTestData();
