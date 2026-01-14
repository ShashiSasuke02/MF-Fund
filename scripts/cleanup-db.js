/**
 * Database Cleanup Script
 * Fixes data integrity issues:
 * 1. Remove invalid user_id = 0 entries
 * 2. Create missing demo accounts
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/mfselection.db');
const BACKUP_PATH = path.join(__dirname, '../data/mfselection_backup_' + Date.now() + '.db');

async function cleanupDatabase() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file not found at:', DB_PATH);
      return;
    }

    // Create backup first
    console.log('📋 Creating backup...');
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log('✅ Backup created at:', BACKUP_PATH);
    console.log('');

    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);

    console.log('='.repeat(80));
    console.log('DATABASE CLEANUP');
    console.log('='.repeat(80));
    console.log('');

    // 1. Remove demo account with user_id = 0
    console.log('🧹 Removing invalid demo account (user_id = 0)...');
    db.run('DELETE FROM demo_accounts WHERE user_id = 0');
    console.log('✅ Removed invalid demo account');
    console.log('');

    // 2. Remove transactions with user_id = 0
    console.log('🧹 Removing invalid transactions (user_id = 0)...');
    const txResult = db.exec('SELECT COUNT(*) as count FROM transactions WHERE user_id = 0');
    const txCount = txResult[0]?.values[0]?.[0] || 0;
    db.run('DELETE FROM transactions WHERE user_id = 0');
    console.log(`✅ Removed ${txCount} invalid transaction(s)`);
    console.log('');

    // 3. Remove holdings with user_id = 0
    console.log('🧹 Removing invalid holdings (user_id = 0)...');
    const invalidHoldingResult = db.exec('SELECT COUNT(*) as count FROM holdings WHERE user_id = 0');
    const invalidHoldingCount = invalidHoldingResult[0]?.values[0]?.[0] || 0;
    db.run('DELETE FROM holdings WHERE user_id = 0');
    console.log(`✅ Removed ${invalidHoldingCount} invalid holding(s)`);
    console.log('');

    // 4. Find users without demo accounts
    console.log('🔍 Checking for users without demo accounts...');
    const usersResult = db.exec(`
      SELECT u.id, u.username 
      FROM users u 
      LEFT JOIN demo_accounts da ON u.id = da.user_id 
      WHERE da.user_id IS NULL
    `);
    
    if (usersResult.length > 0 && usersResult[0].values.length > 0) {
      console.log(`Found ${usersResult[0].values.length} user(s) without demo accounts`);
      
      usersResult[0].values.forEach(([userId, username]) => {
        console.log(`  Creating demo account for User ID ${userId} (${username})...`);
        db.run(
          'INSERT INTO demo_accounts (user_id, balance, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [userId, 1000000.00, Date.now(), Date.now()]
        );
        console.log(`  ✅ Created demo account with ₹10,00,000 balance`);
      });
    } else {
      console.log('✅ All users have demo accounts');
    }
    console.log('');

    // 5. Verify data integrity
    console.log('🔍 Verifying data integrity...');
    const verifyUsers = db.exec('SELECT COUNT(*) FROM users');
    const verifyAccounts = db.exec('SELECT COUNT(*) FROM demo_accounts');
    const verifyTransactions = db.exec('SELECT COUNT(*) FROM transactions');
    const verifyHoldings = db.exec('SELECT COUNT(*) FROM holdings');
    
    const userCount = verifyUsers[0]?.values[0]?.[0] || 0;
    const accountCount = verifyAccounts[0]?.values[0]?.[0] || 0;
    const transactionCount = verifyTransactions[0]?.values[0]?.[0] || 0;
    const holdingCount = verifyHoldings[0]?.values[0]?.[0] || 0;
    
    console.log(`  Users: ${userCount}`);
    console.log(`  Demo Accounts: ${accountCount}`);
    console.log(`  Transactions: ${transactionCount}`);
    console.log(`  Holdings: ${holdingCount}`);
    console.log('');

    // Check for orphaned data
    const orphanedTx = db.exec(`
      SELECT COUNT(*) 
      FROM transactions t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    const orphanedHoldings = db.exec(`
      SELECT COUNT(*) 
      FROM holdings h 
      LEFT JOIN users u ON h.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    const orphanTxCount = orphanedTx[0]?.values[0]?.[0] || 0;
    const orphanHoldingCount = orphanedHoldings[0]?.values[0]?.[0] || 0;
    
    if (orphanTxCount === 0 && orphanHoldingCount === 0) {
      console.log('✅ No orphaned data found');
    } else {
      if (orphanTxCount > 0) console.log(`⚠️  ${orphanTxCount} orphaned transaction(s)`);
      if (orphanHoldingCount > 0) console.log(`⚠️  ${orphanHoldingCount} orphaned holding(s)`);
    }
    console.log('');

    // Save database
    console.log('💾 Saving cleaned database...');
    const data = db.export();
    const newBuffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, newBuffer);
    console.log('✅ Database saved successfully');
    console.log('');

    console.log('='.repeat(80));
    console.log('CLEANUP COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log(`✅ Database cleaned successfully!`);
    console.log(`📋 Backup saved at: ${BACKUP_PATH}`);
    console.log(`📊 Users: ${userCount} | Demo Accounts: ${accountCount}`);
    console.log(`📈 Transactions: ${transactionCount} | Holdings: ${holdingCount}`);
    console.log('');
    console.log('🔄 Please restart your server for changes to take effect.');
    console.log('='.repeat(80));

    db.close();
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    console.log('');
    console.log('💡 You can restore from backup if needed:');
    console.log(`   Copy ${BACKUP_PATH} to ${DB_PATH}`);
  }
}

cleanupDatabase();
