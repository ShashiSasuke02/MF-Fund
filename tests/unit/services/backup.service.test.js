import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.unstable_mockModule('child_process', () => ({
    execSync: jest.fn()
}));

jest.unstable_mockModule('../../../src/services/email.service.js', () => ({
    emailService: {
        sendBackupEmail: jest.fn().mockResolvedValue(true)
    }
}));

jest.unstable_mockModule('../../../src/services/cronNotification.service.js', () => ({
    cronNotificationService: {
        onJobComplete: jest.fn().mockResolvedValue(true)
    }
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    }
}));

// Import module after mocking
const { backupService } = await import('../../../src/services/backup.service.js');
const { execSync } = await import('child_process');
const { emailService } = await import('../../../src/services/email.service.js');
const { cronNotificationService } = await import('../../../src/services/cronNotification.service.js');

describe('Backup Service', () => {
    const backupDir = path.resolve('backups/daily');

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock fs methods
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'mkdirSync').mockImplementation(() => { });
        jest.spyOn(fs, 'statSync').mockReturnValue({ size: 1024 * 1024 * 5, mtimeMs: Date.now() }); // 5MB
        jest.spyOn(fs, 'unlinkSync').mockImplementation(() => { });
        jest.spyOn(fs, 'readdirSync').mockReturnValue([]);

        // Set Env
        process.env.BACKUP_EMAIL = 'admin@example.com';
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should run daily backup successfully', async () => {
        const result = await backupService.runDailyBackup();

        // 1. Verify mariadb-dump call (Alpine's mysql-client provides MariaDB tools)
        expect(execSync).toHaveBeenCalledWith(
            expect.stringContaining('mariadb-dump'),
            expect.objectContaining({ stdio: 'inherit' })
        );

        // 2. Verify compression call
        expect(execSync).toHaveBeenCalledWith(
            expect.stringContaining('tar -czf')
        );

        // 3. Verify email sent
        expect(emailService.sendBackupEmail).toHaveBeenCalledWith(
            expect.stringContaining('.tar.gz'),
            'admin@example.com'
        );

        // 4. Verify notification
        expect(cronNotificationService.onJobComplete).toHaveBeenCalledWith(
            'Daily Database Backup',
            'SUCCESS',
            expect.objectContaining({ archiveSize: '5.00 MB', emailSent: true }),
            null,
            expect.any(Number)
        );

        expect(result.success).toBe(true);
    });

    test('should handle mysqldump failure', async () => {
        execSync.mockImplementationOnce(() => {
            throw new Error('mysqldump failed');
        });

        await expect(backupService.runDailyBackup()).rejects.toThrow('mysqldump failed');

        expect(cronNotificationService.onJobComplete).toHaveBeenCalledWith(
            'Daily Database Backup',
            'FAILED',
            null,
            'mysqldump failed',
            expect.any(Number)
        );
    });

    test('should cleanup old backups', () => {
        const now = Date.now();
        const oldTime = now - (8 * 24 * 60 * 60 * 1000); // 8 days ago

        jest.spyOn(fs, 'readdirSync').mockReturnValue(['old_backup.tar.gz', 'new_backup.tar.gz']);

        jest.spyOn(fs, 'statSync').mockImplementation((filePath) => {
            if (filePath.includes('old_backup')) return { mtimeMs: oldTime };
            return { mtimeMs: now };
        });

        backupService.cleanupOldBackups(backupDir, 7);

        // Should modify fs to delete only old file
        expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('old_backup.tar.gz'));
        expect(fs.unlinkSync).not.toHaveBeenCalledWith(expect.stringContaining('new_backup.tar.gz'));
    });
});
