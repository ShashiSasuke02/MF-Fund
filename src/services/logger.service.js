import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logDir = path.join(__dirname, '../../logs');
console.log(`[Logger] Initializing logs at: ${logDir}`);

try {
    if (!fs.existsSync(logDir)) {
        console.log(`[Logger] Creating log directory: ${logDir}`);
        fs.mkdirSync(logDir, { recursive: true });
    } else {
        console.log(`[Logger] Log directory exists: ${logDir}`);
    }
} catch (err) {
    console.error(`[Logger] Failed to create log directory: ${err.message}`);
    // Fallback? Or just let it crash but with better info?
    // If we can't write logs, we probably can't run.
}

// Custom format for file logging (JSON)
const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Custom format for console logging (Readable)
const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
        const reqId = requestId ? `[${requestId}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level} ${reqId}: ${message} ${metaStr}`;
    })
);

// Define transports
const transports = [
    // Console Transport
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),

    // Daily Rotate File (Application Logs - All levels info and above)
    new DailyRotateFile({
        filename: path.join(logDir, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '7d', // 7 Days retention as requested
        format: fileFormat,
        level: 'info',
    }),

    // Daily Rotate File (Error Logs - Error level only)
    new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '7d', // 7 Days retention
        format: fileFormat,
        level: 'error',
    }),
];

const logger = winston.createLogger({
    level: 'info',
    transports: transports,
});

// Stream for integration with Morgan (if needed, but we're replacing Morgan mostly)
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

export default logger;
