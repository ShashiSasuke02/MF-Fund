#!/usr/bin/env node
/**
 * send-backup-email.js — Email Daily Backup as Attachment
 * 
 * Standalone script that sends the backup .tar.gz as an email attachment
 * using the same SMTP credentials as the main application.
 * 
 * Usage:
 *   node scripts/send-backup-email.js ./backups/daily/2026-02-12.tar.gz
 * 
 * Environment variables (same as main app):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, BACKUP_EMAIL
 */

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// ─── Parse Arguments ──────────────────────────────────────────────────────
const backupPath = process.argv[2];

if (!backupPath || !fs.existsSync(backupPath)) {
    console.error(`❌ Usage: node scripts/send-backup-email.js <path-to-backup.tar.gz>`);
    console.error(`   File not found: ${backupPath || '(none)'}`);
    process.exit(1);
}

// ─── Load .env if running standalone ──────────────────────────────────────
// Try to load dotenv if available (optional dependency)
try {
    const dotenv = await import('dotenv');
    dotenv.config();
} catch {
    // dotenv not installed, rely on environment variables
}

// ─── Validate SMTP Config ─────────────────────────────────────────────────
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const BACKUP_EMAIL = process.env.BACKUP_EMAIL || process.env.CRON_REPORT_EMAIL;

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('❌ SMTP credentials missing (SMTP_HOST, SMTP_USER, SMTP_PASS)');
    process.exit(1);
}

if (!BACKUP_EMAIL) {
    console.error('❌ BACKUP_EMAIL or CRON_REPORT_EMAIL not set');
    process.exit(1);
}

// ─── Send Email ───────────────────────────────────────────────────────────
const filename = path.basename(backupPath);
const stats = fs.statSync(backupPath);
const sizeKB = (stats.size / 1024).toFixed(1);
const date = filename.replace('.tar.gz', '');

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { timeout: 15000 }
});

try {
    const info = await transporter.sendMail({
        from: `"MF Backup System" <${SMTP_FROM}>`,
        to: BACKUP_EMAIL,
        subject: `📦 Daily Backup — ${date} (${sizeKB} KB)`,
        text: [
            `Daily database backup completed successfully.`,
            ``,
            `File: ${filename}`,
            `Size: ${sizeKB} KB`,
            `Date: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
            ``,
            `Tables backed up: users, demo_accounts, holdings, transactions, ledger_entries, funds`,
            `Excluded: fund_nav_history (re-syncable from AMFI)`,
            ``,
            `This is an automated backup from MF-Investments.`,
        ].join('\n'),
        attachments: [{
            filename,
            path: backupPath,
            contentType: 'application/gzip'
        }]
    });

    console.log(`✅ Backup emailed to ${BACKUP_EMAIL} (MessageId: ${info.messageId})`);
    process.exit(0);
} catch (error) {
    console.error(`❌ Failed to send backup email: ${error.message}`);
    process.exit(1);
}
