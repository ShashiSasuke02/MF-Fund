/**
 * Fix Orphaned Data Script
 * This script removes records with invalid user_id (0 or non-existent users)
 */

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/mfselection.db');

async function fixOrphanedData() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file not found at:', DB_PATH);
      return;
    }

    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(DB_PATH);
    const db = new SQL.Database(buffer);

    console.log('='.repeat(80));
    console.log('FIXING ORPHANED DATA');
    console.log('='.repeat(80));

    // Check for invalid transactions (user_id = 0 or non-existent users)
    console.log('\n🔍 Checking for invalid transactions...');
    const invalidTxStmt = db.prepare(`
      SELECT t.id, t.user_id, t.scheme_name, t.amount 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.user_id = 0 OR u.id IS NULL
    `);
    const invalidTransactions = [];
    while (invalidTxStmt.step()) {
      invalidTransactions.push(invalidTxStmt.getAsObject());
    }
    invalidTxStmt.free();

    if (invalidTransactions.length > 0) {
      console.log(`   Found ${invalidTransactions.length} invalid transaction(s):`);
      invalidTransactions.forEach(tx => {
        console.log(`     - Transaction ID: ${tx.id}, User ID: ${tx.user_id}, Scheme: ${tx.scheme_name}, Amount: ₹${tx.amount}`);
      });

      // Delete invalid transactions
      db.run('DELETE FROM transactions WHERE user_id = 0 OR user_id NOT IN (SELECT id FROM users)');
      console.log('   ✅ Deleted invalid transactions');
    } else {
      console.log('   ✓ No invalid transactions found');
    }

    // Check for invalid holdings (user_id = 0 or non-existent users)
    console.log('\n🔍 Checking for invalid holdings...');
    const invalidHoldStmt = db.prepare(`
      SELECT h.id, h.user_id, h.scheme_name, h.invested_amount 
      FROM holdings h
      LEFT JOIN users u ON h.user_id = u.id
      WHERE h.user_id = 0 OR u.id IS NULL
    `);
    const invalidHoldings = [];
    while (invalidHoldStmt.step()) {
      invalidHoldings.push(invalidHoldStmt.getAsObject());
    }
    invalidHoldStmt.free();

    if (invalidHoldings.length > 0) {
      console.log(`   Found ${invalidHoldings.length} invalid holding(s):`);
      invalidHoldings.forEach(h => {
        console.log(`     - Holding ID: ${h.id}, User ID: ${h.user_id}, Scheme: ${h.scheme_name}, Amount: ₹${h.invested_amount}`);
      });

      // Delete invalid holdings
      db.run('DELETE FROM holdings WHERE user_id = 0 OR user_id NOT IN (SELECT id FROM users)');
      console.log('   ✅ Deleted invalid holdings');
    } else {
      console.log('   ✓ No invalid holdings found');
    }

    // Check for invalid demo accounts (user_id = 0 or non-existent users)
    console.log('\n🔍 Checking for invalid demo accounts...');
    const invalidDemoStmt = db.prepare(`
      SELECT d.id, d.user_id, d.balance 
      FROM demo_accounts d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.user_id = 0 OR u.id IS NULL
    `);
    const invalidDemos = [];
    while (invalidDemoStmt.step()) {
      invalidDemos.push(invalidDemoStmt.getAsObject());
    }
    invalidDemoStmt.free();

    if (invalidDemos.length > 0) {
      console.log(`   Found ${invalidDemos.length} invalid demo account(s):`);
      invalidDemos.forEach(d => {
        console.log(`     - Demo Account ID: ${d.id}, User ID: ${d.user_id}, Balance: ₹${d.balance}`);
      });

      // Delete invalid demo accounts
      db.run('DELETE FROM demo_accounts WHERE user_id = 0 OR user_id NOT IN (SELECT id FROM users)');
      console.log('   ✅ Deleted invalid demo accounts');
    } else {
      console.log('   ✓ No invalid demo accounts found');
    }

    // Check for users without demo accounts
    console.log('\n🔍 Checking for users without demo accounts...');
    const noAccountStmt = db.prepare(`
      SELECT u.id, u.username, u.full_name 
      FROM users u
      LEFT JOIN demo_accounts d ON u.id = d.user_id
      WHERE d.id IS NULL
    `);
    const usersWithoutAccounts = [];
    while (noAccountStmt.step()) {
      usersWithoutAccounts.push(noAccountStmt.getAsObject());
    }
    noAccountStmt.free();

    if (usersWithoutAccounts.length > 0) {
      console.log(`   Found ${usersWithoutAccounts.length} user(s) without demo accounts:`);
      usersWithoutAccounts.forEach(u => {
        console.log(`     - User ID: ${u.id}, Username: ${u.username}, Name: ${u.full_name}`);
        // Create demo account for user
        db.run('INSERT INTO demo_accounts (user_id, balance) VALUES (?, ?)', [u.id, 1000000.00]);
        console.log(`       ✅ Created demo account with ₹10,00,000 balance`);
      });
    } else {
      console.log('   ✓ All users have demo accounts');
    }

    // Save database
    const data = db.export();
    const bufferOut = Buffer.from(data);
    fs.writeFileSync(DB_PATH, bufferOut);
    console.log('\n✅ Database saved successfully');

    console.log('='.repeat(80));
    console.log('FIX COMPLETE');
    console.log('='.repeat(80));

    db.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOrphanedData();
