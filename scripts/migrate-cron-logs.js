
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mf_selection_app'
};

const createTableSQL = `
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
`;

async function migrate() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(config);
        console.log('Connected.');

        console.log('Creating cron_job_logs table...');
        await connection.query(createTableSQL);
        console.log('Table created successfully.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
