-- AMC Master table (curated list of fund houses)
CREATE TABLE IF NOT EXISTS amc_master (
    fund_house TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    logo_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- API Cache table for MFapi.in responses
CREATE TABLE IF NOT EXISTS api_cache (
    cache_key TEXT PRIMARY KEY,
    response_json TEXT NOT NULL,
    fetched_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at);

-- Seed the AMC Master table with top 3 fund houses
INSERT OR IGNORE INTO amc_master (fund_house, display_name, display_order) VALUES
    ('SBI Mutual Fund', 'SBI Mutual Fund', 1),
    ('ICICI Prudential Mutual Fund', 'ICICI Prudential Mutual Fund', 2),
    ('HDFC Mutual Fund', 'HDFC Mutual Fund', 3);

-- Users table for demo account holders
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email_id TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Demo accounts table (one per user, fixed starting balance)
CREATE TABLE IF NOT EXISTS demo_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    balance REAL NOT NULL DEFAULT 1000000.00,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table for SIP, STP, Lump Sum, SWP
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scheme_code INTEGER NOT NULL,
    scheme_name TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'SIP', 'STP', 'LUMP_SUM', 'SWP'
    amount REAL NOT NULL,
    units REAL,
    nav REAL,
    frequency TEXT, -- 'MONTHLY', 'QUARTERLY', 'WEEKLY' for SIP/STP/SWP
    start_date TEXT, -- ISO date for scheduled transactions
    end_date TEXT, -- ISO date for scheduled transactions (optional)
    installments INTEGER, -- Number of installments for SIP/STP
    status TEXT NOT NULL DEFAULT 'SUCCESS', -- 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'
    executed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Holdings table for user's mutual fund portfolio
CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    scheme_code INTEGER NOT NULL,
    scheme_name TEXT NOT NULL,
    total_units REAL NOT NULL DEFAULT 0,
    invested_amount REAL NOT NULL DEFAULT 0,
    current_value REAL,
    last_nav REAL,
    last_nav_date TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
    UNIQUE(user_id, scheme_code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_id);
CREATE INDEX IF NOT EXISTS idx_demo_accounts_user_id ON demo_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
