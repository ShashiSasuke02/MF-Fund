import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../services/logger.service.js';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '../../backups/daily');

/**
 * List available backup files
 */
export const getBackupFiles = async (req, res) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return res.json({ success: true, files: [] });
        }

        const files = await fs.promises.readdir(BACKUP_DIR);
        const tarFiles = files.filter(f => f.endsWith('.tar.gz'));

        const fileStats = await Promise.all(
            tarFiles.map(async (file) => {
                const stats = await fs.promises.stat(path.join(BACKUP_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
        );

        // Sort: newest first
        fileStats.sort((a, b) => b.modified - a.modified);

        res.json({
            success: true,
            files: fileStats
        });
    } catch (error) {
        logger.error('Error fetching backup files', { requestId: req.requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to fetch backup files' });
    }
};

/**
 * Download a single backup file
 */
export const downloadBackupFile = (req, res) => {
    const { filename } = req.params;

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeFilename);

    if (!safeFilename.endsWith('.tar.gz')) {
        return res.status(400).json({ success: false, message: 'Invalid file type' });
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Backup file not found' });
    }

    logger.info(`[Admin] Downloading backup: ${safeFilename}`, { requestId: req.requestId });

    res.download(filePath, safeFilename, (err) => {
        if (err) {
            logger.error('Error downloading backup file', { requestId: req.requestId, error: err.message });
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Error downloading file' });
            }
        }
    });
};

/**
 * Download all backup files as a single ZIP archive
 */
export const downloadAllBackups = async (req, res) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            return res.status(404).json({ success: false, message: 'No backups directory found' });
        }

        const files = await fs.promises.readdir(BACKUP_DIR);
        const tarFiles = files.filter(f => f.endsWith('.tar.gz'));

        if (tarFiles.length === 0) {
            return res.status(404).json({ success: false, message: 'No backup files found' });
        }

        const zip = new AdmZip();

        for (const file of tarFiles) {
            zip.addLocalFile(path.join(BACKUP_DIR, file));
        }

        const today = new Date().toISOString().split('T')[0];
        const zipFilename = `all-backups-${today}.zip`;
        const zipBuffer = zip.toBuffer();

        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${zipFilename}`);
        res.set('Content-Length', zipBuffer.length);

        logger.info(`[Admin] Downloaded all backups as ZIP: ${zipFilename}`, { requestId: req.requestId });

        res.send(zipBuffer);
    } catch (error) {
        logger.error('Error creating backups ZIP', { requestId: req.requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to create backups archive' });
    }
};
