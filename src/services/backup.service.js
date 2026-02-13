import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { emailService } from './email.service.js';
import { cronNotificationService } from './cronNotification.service.js';
import logger from './logger.service.js';

export const backupService = {
    /**
     * Run Daily Database Backup
     * 1. Dump specific tables
     * 2. Compress to .tar.gz
     * 3. Email to admin
     * 4. Cleanup old backups
     */
    async runDailyBackup() {
        logger.info('[Backup] Starting daily database backup...');
        const startTime = Date.now();
        const today = new Date().toISOString().split('T')[0];
        const backupDir = path.resolve('backups/daily');
        const sqlFile = path.join(backupDir, `${today}.sql`);
        const archiveFile = path.join(backupDir, `backup_${today}.tar.gz`);

        // Ensure directory exists
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        try {
            // 1. Run mysqldump
            // Tables to backup: users, demo_accounts, holdings, transactions, ledger_entries, funds
            // We skip fund_nav_history as it's huge and re-syncable
            const tables = 'users demo_accounts holdings transactions ledger_entries funds';
            const dbHost = process.env.DB_HOST || 'mysql';
            const dbUser = process.env.DB_USER || 'mf_user';
            const dbPass = process.env.DB_PASSWORD || 'mf_password';
            const dbName = process.env.DB_NAME || 'mf_selection';

            // Using --column-statistics=0 for compatibility
            const dumpCmd = `mysqldump -h ${dbHost} -u ${dbUser} -p'${dbPass}' --single-transaction --quick --lock-tables=false --routines --triggers --column-statistics=0 ${dbName} ${tables} > "${sqlFile}"`;

            logger.info(`[Backup] Dumping tables: ${tables}`);
            execSync(dumpCmd, { stdio: 'inherit' });

            // 2. Compress
            logger.info('[Backup] Compressing archive...');
            const tarCmd = `tar -czf "${archiveFile}" -C "${backupDir}" "${today}.sql"`;
            execSync(tarCmd);

            // get valid archive size
            const stats = fs.statSync(archiveFile);
            const archiveSize = (stats.size / 1024 / 1024).toFixed(2) + ' MB';

            // Remove raw SQL file to save space
            if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);

            logger.info(`[Backup] Created archive: ${archiveFile} (${archiveSize})`);

            // 3. Email Backup
            const recipient = process.env.BACKUP_EMAIL;
            let emailSent = false;

            if (recipient) {
                logger.info(`[Backup] Sending email to ${recipient}...`);
                try {
                    emailSent = await emailService.sendBackupEmail(archiveFile, recipient);
                } catch (emailErr) {
                    logger.error(`[Backup] Failed to send email: ${emailErr.message}`);
                    // Don't fail the whole job just because email failed
                }
            } else {
                logger.warn('[Backup] BACKUP_EMAIL not set, skipping email.');
            }

            // 4. Cleanup Old Backups (> 7 days)
            this.cleanupOldBackups(backupDir, 7);

            const duration = Date.now() - startTime;

            // Notify Cron Service
            await cronNotificationService.onJobComplete(
                'Daily Database Backup',
                'SUCCESS',
                { archiveSize, emailSent, recipient },
                null,
                duration
            );

            return { success: true, archiveSize, emailSent };

        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error('[Backup] Job failed:', error);

            // Cleanup temp files if exist
            if (fs.existsSync(sqlFile)) fs.unlinkSync(sqlFile);

            await cronNotificationService.onJobComplete(
                'Daily Database Backup',
                'FAILED',
                null,
                error.message,
                duration
            );

            throw error;
        }
    },

    /**
     * Delete backups older than N days
     */
    cleanupOldBackups(dir, daysToKeep) {
        try {
            const files = fs.readdirSync(dir);
            const now = Date.now();
            let deletedCount = 0;

            files.forEach(file => {
                if (!file.endsWith('.tar.gz')) return;

                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);
                const daysOld = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                if (daysOld > daysToKeep) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    logger.info(`[Backup] Deleted old backup: ${file}`);
                }
            });

            if (deletedCount > 0) {
                logger.info(`[Backup] Cleanup complete. Removed ${deletedCount} old files.`);
            }
        } catch (err) {
            logger.warn(`[Backup] Cleanup failed: ${err.message}`);
        }
    }
};
