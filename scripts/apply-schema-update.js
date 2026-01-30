import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function applySchemaUpdates() {
    console.log('🔄 Starting Schema Update...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        const columnsToAdd = [
            "ADD COLUMN aum DECIMAL(20, 2) DEFAULT NULL",
            "ADD COLUMN expense_ratio VARCHAR(20) DEFAULT NULL",
            "ADD COLUMN risk_level VARCHAR(50) DEFAULT NULL",
            "ADD COLUMN returns_1y DECIMAL(10, 2) DEFAULT NULL",
            "ADD COLUMN returns_3y DECIMAL(10, 2) DEFAULT NULL",
            "ADD COLUMN returns_5y DECIMAL(10, 2) DEFAULT NULL",
            "ADD COLUMN min_lumpsum DECIMAL(15, 2) DEFAULT NULL",
            "ADD COLUMN min_sip DECIMAL(15, 2) DEFAULT NULL",
            "ADD COLUMN fund_manager VARCHAR(255) DEFAULT NULL",
            "ADD COLUMN detail_info_synced_at BIGINT DEFAULT NULL"
        ];

        console.log(`📝 Checking ${columnsToAdd.length} columns...`);

        // Check if columns exist
        const [existingColumns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'funds'
        `, [process.env.DB_NAME || 'mfselection']);

        const existingColumnNames = existingColumns.map(row => row.COLUMN_NAME);

        for (const colDef of columnsToAdd) {
            // Extract column name from definition (e.g., "ADD COLUMN aum ...")
            const colName = colDef.split(' ')[2];

            if (!existingColumnNames.includes(colName)) {
                console.log(`➕ Adding column: ${colName}`);
                await connection.query(`ALTER TABLE funds ${colDef}`);
            } else {
                console.log(`✅ Column already stands: ${colName}`);
            }
        }

        console.log('🎉 Schema update complete!');

    } catch (error) {
        console.error('❌ Schema update failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

applySchemaUpdates();
