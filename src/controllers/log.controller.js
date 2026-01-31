import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from '../services/logger.service.js';

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

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
    res.setHeader('Content-Type', safeFilename.endsWith('.json') ? 'application/json' : 'text/plain');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
        logger.error('Error streaming log file', { requestId: req.requestId, error: error.message });
        // If headers sent, we can't send JSON error, connection will just close
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error downloading file' });
        }
    });
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
