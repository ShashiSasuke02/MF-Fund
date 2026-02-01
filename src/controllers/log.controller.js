import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../services/logger.service.js';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../../logs');

export const getLogFiles = async (req, res) => {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            return res.json({ success: true, files: [] });
        }

        const files = await fs.promises.readdir(LOG_DIR);

        // Sort files by creation time (primary) or name (secondary) - newest first
        const fileStats = await Promise.all(
            files.map(async (file) => {
                const stats = await fs.promises.stat(path.join(LOG_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
        );

        // Sort: Modified desc
        fileStats.sort((a, b) => b.modified - a.modified);

        res.json({
            success: true,
            files: fileStats
        });
    } catch (error) {
        logger.error('Error fetching log files', { requestId: req.requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to fetch log files' });
    }
};

export const downloadLogFile = (req, res) => {
    const { filename } = req.params;

    // Basic security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(LOG_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Log file not found' });
    }

    // Use express helper for robust download handling (handles headers, streams, etc.)
    res.download(filePath, safeFilename, (err) => {
        if (err) {
            // Only log and respond if headers haven't been sent
            logger.error('Error downloading log file', { requestId: req.requestId, error: err.message });
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: 'Error downloading file' });
            }
        }
    });
};

/**
 * Download all log files as a single ZIP archive
 */
export const downloadAllLogs = async (req, res) => {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            return res.status(404).json({ success: false, message: 'No logs directory found' });
        }

        const zip = new AdmZip();

        // Add all files from the logs directory
        zip.addLocalFolder(LOG_DIR);

        // Generate filename with current date
        const today = new Date().toISOString().split('T')[0];
        const zipFilename = `system-logs-${today}.zip`;

        // Generate ZIP buffer
        const zipBuffer = zip.toBuffer();

        // Set headers for download
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${zipFilename}`);
        res.set('Content-Length', zipBuffer.length);

        logger.info(`[Admin] Downloaded all logs as ZIP: ${zipFilename}`, { requestId: req.requestId });

        res.send(zipBuffer);
    } catch (error) {
        logger.error('Error creating logs ZIP', { requestId: req.requestId, error: error.message });
        res.status(500).json({ success: false, message: 'Failed to create logs archive' });
    }
};

// Log Client Errors (from Frontend)
export const logClientError = (req, res) => {
    const { message, stack, componentStack, url } = req.body;

    logger.error(`[CLIENT-ERROR] ${message}`, {
        requestId: req.requestId,
        stack, // JS Error Stack
        componentStack, // React Component Stack
        url, // Page URL
        source: 'frontend'
    });

    res.json({ success: true });
};
