-- =============================================================================
-- MF-Investments Master Database Initialization Script
-- =============================================================================
-- This script initializes the mf_selection_app database with all required 
-- tables and initial seed data.
-- =============================================================================

-- AMC Master table (curated list of fund houses)
CREATE TABLE IF NOT EXISTS amc_master (
    fund_house VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    logo_url TEXT,
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000)
);

-- API Cache table for MFapi.in responses
CREATE TABLE IF NOT EXISTS api_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    response_json LONGTEXT NOT NULL,
    fetched_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    INDEX idx_api_cache_expires_at (expires_at)
);

-- Seed the AMC Master table
INSERT IGNORE INTO amc_master (fund_house, display_name, display_order) VALUES
    ('SBI Mutual Fund', 'SBI Mutual Fund', 1),
    ('ICICI Prudential Mutual Fund', 'ICICI Prudential Mutual Fund', 2),
    ('HDFC Mutual Fund', 'HDFC Mutual Fund', 3),
    ('Nippon India Mutual Fund', 'Nippon India Mutual Fund', 4),
    ('Kotak Mahindra Mutual Fund', 'Kotak Mahindra Mutual Fund', 5),
    ('Aditya Birla Sun Life Mutual Fund', 'Aditya Birla Sun Life Mutual Fund', 6),
    ('Axis Mutual Fund', 'Axis Mutual Fund', 7),
    ('UTI Mutual Fund', 'UTI Mutual Fund', 8),
    ('DSP Mutual Fund', 'DSP Mutual Fund', 9),
    ('IDFC Mutual Fund', 'IDFC Mutual Fund', 10);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email_id VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    INDEX idx_users_username (username),
    INDEX idx_users_email (email_id)
);

-- Pending Registrations table (for OTP verification)
CREATE TABLE IF NOT EXISTS pending_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email_id VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    otp_attempts INT DEFAULT 0,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    INDEX idx_pending_email (email_id),
    INDEX idx_pending_expires (expires_at)
);

-- Demo accounts table
CREATE TABLE IF NOT EXISTS demo_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    balance DECIMAL(15,2) NOT NULL DEFAULT 1000000.00,
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_demo_accounts_user_id (user_id)
);

-- Funds Master table
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

    -- Enrichment Columns
    aum DECIMAL(20, 2) DEFAULT NULL,
    expense_ratio VARCHAR(20) DEFAULT NULL,
    risk_level VARCHAR(50) DEFAULT NULL,
    returns_1y DECIMAL(10, 2) DEFAULT NULL,
    returns_3y DECIMAL(10, 2) DEFAULT NULL,
    returns_5y DECIMAL(10, 2) DEFAULT NULL,
    min_lumpsum DECIMAL(15, 2) DEFAULT NULL,
    min_sip DECIMAL(15, 2) DEFAULT NULL,
    fund_manager VARCHAR(255) DEFAULT NULL,
    investment_objective TEXT DEFAULT NULL,
    fund_start_date DATE DEFAULT NULL,
    detail_info_synced_at BIGINT DEFAULT NULL,

    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    last_synced_at BIGINT,
    INDEX idx_funds_scheme_name (scheme_name),
    INDEX idx_funds_scheme_category (scheme_category),
    INDEX idx_funds_fund_house (fund_house),
    INDEX idx_funds_is_active (is_active)
);

-- Fund NAV History table
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
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_code INT NOT NULL,
    scheme_name VARCHAR(500) NOT NULL,
    transaction_type ENUM('SIP', 'STP', 'LUMP_SUM', 'SWP') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    units DECIMAL(15,4),
    nav DECIMAL(15,4),
    frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'),
    start_date VARCHAR(10),
    end_date VARCHAR(10),
    installments INT,
    execution_count INT NOT NULL DEFAULT 0,
    next_execution_date VARCHAR(10),
    last_execution_date VARCHAR(10),
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'RECURRING') NOT NULL DEFAULT 'SUCCESS',
    failure_reason TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at BIGINT,
    executed_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_transactions_user_id (user_id),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_next_execution (next_execution_date, status),
    INDEX idx_transactions_locked (is_locked, locked_at)
);

-- Holdings table
CREATE TABLE IF NOT EXISTS holdings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    scheme_code INT NOT NULL,
    scheme_name VARCHAR(500) NOT NULL,
    total_units DECIMAL(15,4) NOT NULL DEFAULT 0,
    invested_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_value DECIMAL(15,2),
    last_nav DECIMAL(15,4),
    last_nav_date VARCHAR(10),
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    UNIQUE KEY unique_user_scheme (user_id, scheme_code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_holdings_user_id (user_id)
);

-- Execution logs table
CREATE TABLE IF NOT EXISTS execution_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    execution_date VARCHAR(10) NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'SKIPPED') NOT NULL,
    amount DECIMAL(15,2),
    units DECIMAL(15,4),
    nav DECIMAL(15,4),
    balance_before DECIMAL(15,2),
    balance_after DECIMAL(15,2),
    failure_reason TEXT,
    execution_duration_ms INT,
    executed_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_execution_logs_transaction_id (transaction_id)
);

-- User Notifications table for async alerts (SWP execution, etc.)
CREATE TABLE IF NOT EXISTS user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('SUCCESS', 'ERROR', 'INFO') DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id, is_read),
    INDEX idx_notifications_created (created_at)
);

-- Fund Sync Log table
CREATE TABLE IF NOT EXISTS fund_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('FULL', 'INCREMENTAL') NOT NULL DEFAULT 'FULL',
    sync_status ENUM('STARTED', 'SUCCESS', 'PARTIAL', 'FAILED') NOT NULL DEFAULT 'STARTED',
    start_time BIGINT NOT NULL,
    end_time BIGINT,
    total_funds_fetched INT DEFAULT 0,
    funds_inserted INT DEFAULT 0,
    funds_updated INT DEFAULT 0,
    nav_records_inserted INT DEFAULT 0,
    error_count INT DEFAULT 0,
    execution_duration_ms INT,
    error_details TEXT,
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    INDEX idx_fund_sync_log_status (sync_status),
    INDEX idx_fund_sync_log_start_time (start_time)
);

-- Cron Job Logs table
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_name VARCHAR(255) NOT NULL,
    status ENUM('RUNNING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'RUNNING',
    start_time BIGINT NOT NULL,
    end_time BIGINT,
    duration_ms INT,
    message TEXT,
    error_details TEXT,
    triggered_by ENUM('SCHEDULE', 'MANUAL') NOT NULL DEFAULT 'SCHEDULE',
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
    INDEX idx_cron_logs_job_name (job_name),
    INDEX idx_cron_logs_status (status),
    INDEX idx_cron_logs_start_time (start_time)
);
