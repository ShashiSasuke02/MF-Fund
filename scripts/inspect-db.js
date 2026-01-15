/**
 * Database Inspection Script - MySQL Version
 * Run this to see all users, demo accounts, transactions, and holdings
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

async function inspectDatabase() {
  let connection = null;
  
  try {
    connection = await connectDatabase();

    console.log('='.repeat(80));
    console.log('DATABASE INSPECTION REPORT');
    console.log('='.repeat(80));
    console.log('Database:', process.env.DB_NAME || 'mfselection');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('');

    // Users
    console.log('📊 USERS');
    console.log('-'.repeat(80));
    const [users] = await connection.query(
      'SELECT id, username, full_name, email_id, created_at FROM users ORDER BY id'
    );
    
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach(user => {
        console.log(`  User ID: ${user.id}`);
        console.log(`    Username: ${user.username}`);
        console.log(`    Full Name: ${user.full_name}`);
        console.log(`    Email: ${user.email_id}`);
        console.log(`    Created: ${new Date(user.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    console.log(`Total users: ${users.length}\n`);

    // Demo Accounts
    console.log('💰 DEMO ACCOUNTS');
    console.log('-'.repeat(80));
    const [accounts] = await connection.query(
      'SELECT user_id, balance, created_at FROM demo_accounts ORDER BY user_id'
    );
    
    if (accounts.length === 0) {
      console.log('No demo accounts found.');
    } else {
      accounts.forEach(acc => {
        const user = users.find(u => u.id === acc.user_id);
        console.log(`  User ID: ${acc.user_id} (${user?.username || 'Unknown'})`);
        console.log(`    Balance: ₹${Number(acc.balance).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
        console.log(`    Created: ${new Date(acc.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    console.log(`Total demo accounts: ${accounts.length}\n`);

    // Transactions
    console.log('📈 TRANSACTIONS');
    console.log('-'.repeat(80));
    const [transactions] = await connection.query(
      'SELECT user_id, scheme_code, scheme_name, transaction_type, amount, status, executed_at FROM transactions ORDER BY user_id, executed_at DESC'
    );
    
    if (transactions.length === 0) {
      console.log('No transactions found.');
    } else {
      // Group by user_id
      const txByUser = transactions.reduce((acc, tx) => {
        if (!acc[tx.user_id]) acc[tx.user_id] = [];
        acc[tx.user_id].push(tx);
        return acc;
      }, {});

      Object.keys(txByUser).forEach(userId => {
        const user = users.find(u => u.id === Number(userId));
        const userTxs = txByUser[userId];
        console.log(`  User ID: ${userId} (${user?.username || 'Unknown'}) - ${userTxs.length} transaction(s)`);
        userTxs.slice(0, 5).forEach(tx => {
          console.log(`    • ${tx.transaction_type} | ${tx.scheme_name.substring(0, 30)}... | ₹${Number(tx.amount).toLocaleString('en-IN')} | ${tx.status}`);
        });
        if (userTxs.length > 5) {
          console.log(`    ... and ${userTxs.length - 5} more`);
        }
        console.log('');
      });
    }
    console.log(`Total transactions: ${transactions.length}\n`);

    // Holdings
    console.log('📁 HOLDINGS');
    console.log('-'.repeat(80));
    const [holdings] = await connection.query(
      'SELECT user_id, scheme_code, scheme_name, total_units, invested_amount, current_value FROM holdings ORDER BY user_id, invested_amount DESC'
    );
    
    if (holdings.length === 0) {
      console.log('No holdings found.');
    } else {
      // Group by user_id
      const holdingsByUser = holdings.reduce((acc, h) => {
        if (!acc[h.user_id]) acc[h.user_id] = [];
        acc[h.user_id].push(h);
        return acc;
      }, {});

      Object.keys(holdingsByUser).forEach(userId => {
        const user = users.find(u => u.id === Number(userId));
        const userHoldings = holdingsByUser[userId];
        console.log(`  User ID: ${userId} (${user?.username || 'Unknown'}) - ${userHoldings.length} holding(s)`);
        userHoldings.forEach(h => {
          console.log(`    • ${h.scheme_name.substring(0, 40)}...`);
          console.log(`      Units: ${Number(h.total_units).toFixed(4)} | Invested: ₹${Number(h.invested_amount).toLocaleString('en-IN')}`);
          console.log(`      Current Value: ₹${Number(h.current_value || 0).toLocaleString('en-IN')}`);
        });
        console.log('');
      });
    }
    console.log(`Total holdings: ${holdings.length}\n`);

    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Users: ${users.length}`);
    console.log(`Total Demo Accounts: ${accounts.length}`);
    console.log(`Total Transactions: ${transactions.length}`);
    console.log(`Total Holdings: ${holdings.length}`);
    console.log('='.repeat(80));

    // Check for data integrity issues
    console.log('\n🔍 DATA INTEGRITY CHECKS');
    console.log('-'.repeat(80));
    
    // Check for users without demo accounts
    const usersWithoutAccounts = users.filter(u => !accounts.find(a => a.user_id === u.id));
    if (usersWithoutAccounts.length > 0) {
      console.log(`⚠️  ${usersWithoutAccounts.length} user(s) without demo accounts:`);
      usersWithoutAccounts.forEach(u => console.log(`   - User ID ${u.id}: ${u.username}`));
    } else {
      console.log('✅ All users have demo accounts');
    }

    // Check for transactions without matching user
    const orphanedTransactions = transactions.filter(tx => !users.find(u => u.id === tx.user_id));
    if (orphanedTransactions.length > 0) {
      console.log(`⚠️  ${orphanedTransactions.length} transaction(s) with invalid user_id`);
    } else {
      console.log('✅ All transactions have valid user references');
    }

    // Check for holdings without matching user
    const orphanedHoldings = holdings.filter(h => !users.find(u => u.id === h.user_id));
    if (orphanedHoldings.length > 0) {
      console.log(`⚠️  ${orphanedHoldings.length} holding(s) with invalid user_id`);
    } else {
      console.log('✅ All holdings have valid user references');
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

inspectDatabase();
