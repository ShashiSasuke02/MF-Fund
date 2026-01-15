/**
 * Database Cleanup Script - MySQL Version
 * Fixes data integrity issues:
 * 1. Remove invalid user_id = 0 entries
 * 2. Create missing demo accounts
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function connectDatabase() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mfselection'
  });
}

async function cleanupDatabase() {
  let connection = null;
  
  try {
    connection = await connectDatabase();

    console.log('='.repeat(80));
    console.log('DATABASE CLEANUP');
    console.log('='.repeat(80));
    console.log('');

    // 1. Remove demo account with user_id = 0
    console.log('🧹 Removing invalid demo account (user_id = 0)...');
    const [demoResult] = await connection.execute('DELETE FROM demo_accounts WHERE user_id = 0');
    console.log(`✅ Removed ${demoResult.affectedRows} invalid demo account(s)`);
    console.log('');

    // 2. Remove transactions with user_id = 0
    console.log('🧹 Removing invalid transactions (user_id = 0)...');
    const [txResult] = await connection.execute('DELETE FROM transactions WHERE user_id = 0');
    console.log(`✅ Removed ${txResult.affectedRows} invalid transaction(s)`);
    console.log('');

    // 3. Remove holdings with user_id = 0
    console.log('🧹 Removing invalid holdings (user_id = 0)...');
    const [holdingResult] = await connection.execute('DELETE FROM holdings WHERE user_id = 0');
    console.log(`✅ Removed ${holdingResult.affectedRows} invalid holding(s)`);
    console.log('');

    // 4. Find users without demo accounts
    console.log('🔍 Checking for users without demo accounts...');
    const [usersWithoutAccounts] = await connection.query(`
      SELECT u.id, u.username 
      FROM users u 
      LEFT JOIN demo_accounts da ON u.id = da.user_id 
      WHERE da.user_id IS NULL
    `);
    
    if (usersWithoutAccounts.length > 0) {
      console.log(`Found ${usersWithoutAccounts.length} user(s) without demo accounts`);
      
      for (const user of usersWithoutAccounts) {
        console.log(`  Creating demo account for User ID ${user.id} (${user.username})...`);
        await connection.execute(
          'INSERT INTO demo_accounts (user_id, balance, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [user.id, 10000000.00, Date.now(), Date.now()]
        );
        console.log(`  ✅ Created demo account with ₹1,00,00,000 balance`);
      }
    } else {
      console.log('✅ All users have demo accounts');
    }
    console.log('');

    // 5. Verify data integrity
    console.log('🔍 Verifying data integrity...');
    const [[{ userCount }]] = await connection.query('SELECT COUNT(*) as userCount FROM users');
    const [[{ accountCount }]] = await connection.query('SELECT COUNT(*) as accountCount FROM demo_accounts');
    const [[{ transactionCount }]] = await connection.query('SELECT COUNT(*) as transactionCount FROM transactions');
    const [[{ holdingCount }]] = await connection.query('SELECT COUNT(*) as holdingCount FROM holdings');
    
    console.log(`  Users: ${userCount}`);
    console.log(`  Demo Accounts: ${accountCount}`);
    console.log(`  Transactions: ${transactionCount}`);
    console.log(`  Holdings: ${holdingCount}`);
    console.log('');

    if (userCount === accountCount) {
      console.log('✅ Data integrity verified: All users have demo accounts');
    } else {
      console.log(`⚠️  Warning: User count (${userCount}) does not match demo account count (${accountCount})`);
    }

    console.log('='.repeat(80));
    console.log('✅ DATABASE CLEANUP COMPLETED');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanupDatabase();
