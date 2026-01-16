import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration script to create tables for MFAPI ingestion
 * Tables: funds, fund_nav_history, fund_sync_log
 * 
 * Run: node scripts/migrate-fund-tables.js
 */

async function migrateFundTables() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mf_selection_app'
    });

    console.log('✅ Connected to MySQL database');

    // 1. Create funds table (master fund directory - 10 AMCs only)
    console.log('\n📋 Creating funds table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS funds (
        scheme_code INT PRIMARY KEY,
        scheme_name VARCHAR(500) NOT NULL,
        scheme_category VARCHAR(255),
        scheme_type VARCHAR(100),
        fund_house VARCHAR(255),
        amc_code VARCHAR(50),
        launch_date DATE,
        isin VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
        updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
        last_synced_at BIGINT,
        INDEX idx_funds_scheme_name (scheme_name),
        INDEX idx_funds_scheme_category (scheme_category),
        INDEX idx_funds_fund_house (fund_house),
        INDEX idx_funds_is_active (is_active)
      )
    `);
    console.log('✅ funds table created successfully');

    // 2. Create fund_nav_history table (latest 30 records per fund)
    console.log('\n📋 Creating fund_nav_history table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS fund_nav_history (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        scheme_code INT NOT NULL,
        nav_date DATE NOT NULL,
        nav_value DECIMAL(15,4) NOT NULL,
        created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
        UNIQUE KEY unique_scheme_date (scheme_code, nav_date),
        FOREIGN KEY (scheme_code) REFERENCES funds(scheme_code) ON DELETE CASCADE,
        INDEX idx_nav_history_scheme_code (scheme_code),
        INDEX idx_nav_history_scheme_date (scheme_code, nav_date DESC)
      )
    `);
    console.log('✅ fund_nav_history table created successfully');

    // 3. Create fund_sync_log table (ingestion audit trail)
    console.log('\n📋 Creating fund_sync_log table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS fund_sync_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        sync_type ENUM('FULL', 'INCREMENTAL') NOT NULL,
        sync_status ENUM('STARTED', 'SUCCESS', 'PARTIAL', 'FAILED') NOT NULL,
        start_time BIGINT NOT NULL,
        end_time BIGINT,
        total_funds_fetched INT DEFAULT 0,
        funds_inserted INT DEFAULT 0,
        funds_updated INT DEFAULT 0,
        nav_records_inserted INT DEFAULT 0,
        error_count INT DEFAULT 0,
        error_details TEXT,
        execution_duration_ms INT,
        created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
        INDEX idx_sync_log_sync_status (sync_status),
        INDEX idx_sync_log_start_time (start_time)
      )
    `);
    console.log('✅ fund_sync_log table created successfully');

    // Verify tables
    console.log('\n🔍 Verifying created tables...');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'fund%'
    `);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📊 Created tables:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    console.log('\n📝 Summary:');
    console.log('   • funds: Master fund directory (10 AMCs)');
    console.log('   • fund_nav_history: Latest 30 NAV records per fund');
    console.log('   • fund_sync_log: Ingestion audit trail');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Database connection closed');
    }
  }
}

// Run migration
migrateFundTables();
