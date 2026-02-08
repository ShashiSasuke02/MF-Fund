import fs from 'fs';
import logger from './logger.service.js';
import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            logger.warn('[EmailService] SMTP credentials missing. Email sending disabled.');
            return;
        }

        const port = parseInt(process.env.SMTP_PORT || '587');
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtppro.zoho.in',
            port: port,
            secure: port === 465, // true for 465 (SSL), false for other ports (TLS)
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                timeout: 10000 // 10 seconds timeout
            }
        });

        this.initialized = true;
        logger.info('[EmailService] Initialized with host:', process.env.SMTP_HOST);
    }

    /**
     * Send OTP email
     * @param {string} toEmail 
     * @param {string} otp 
     */
    async sendOTP(toEmail, otp) {
        if (!this.initialized) this.init();

        if (!this.transporter) {
            logger.info(`[EmailService] MOCK SEND: OTP for ${toEmail} is ${otp}`);
            return true; // Return true to allow dev flows without SMTP
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"TryMutualFunds" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: toEmail,
                subject: 'Verify your registration - TryMutualFunds',
                text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
                html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4F46E5;">Verify your email</h2>
            <p>Thank you for registering with TryMutualFunds.</p>
            <p>Your verification code is:</p>
            <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code expires in 10 minutes.</p>
            <p style="font-size: 12px; color: #6B7280; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
        `
            });

            logger.info(`[EmailService] OTP sent to ${toEmail}. MessageId: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error(`[EmailService] Failed to send OTP to ${toEmail}:`, error.message);
            // Don't throw, just return false so registration flow handles it gracefully
            return false;
        }
    }

    /**
     * Send Cron Job Report Email
     * @param {Object} reportData - Report data
     */
    async sendCronJobReport(reportData) {
        if (!this.initialized) this.init();

        if (!this.transporter) {
            logger.info('[EmailService] MOCK: Would send cron report to', reportData.recipient);
            return true;
        }

        const {
            recipient,
            date,
            jobs,
            totalDuration,
            successCount,
            failedCount,
            // Scheduler Stats
            transactionCount,
            totalInvested,
            totalWithdrawn,
            // Sync Stats
            fundsFetched,
            fundsInserted,
            navUpdated,
            errors,
            // AMFI Sync Stats
            totalParsed,
            matchedFunds,
            skippedNoMatch,
            // Meta
            reportType
        } = reportData;

        // Money Formatter
        const formatMoney = (amount) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount || 0);
        };

        const formatDuration = (ms) => {
            if (ms < 1000) return `${ms}ms`;
            if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
            return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
        };

        // --- THEME CONFIGURATION ---
        // Futuristic Fintech Palette
        const colors = {
            bg: '#F8FAFC', // Slate 50
            card: '#FFFFFF',
            textPrimary: '#0F172A', // Slate 900
            textSecondary: '#64748B', // Slate 500
            border: '#E2E8F0', // Slate 200
            success: '#10B981', // Emerald 500
            successDark: '#047857', // Emerald 700
            successBg: '#ECFDF5', // Emerald 50
            error: '#EF4444', // Red 500
            errorDark: '#B91C1C', // Red 700
            errorBg: '#FEF2F2', // Red 50
            warning: '#F59E0B', // Amber 500
            brandGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            accentGradient: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)'
        };

        let headerTitle = 'Nightly System Report';
        let subTitle = 'System Audit & Performance Log';

        if (reportType === 'SCHEDULER') {
            headerTitle = 'Daily Transaction Report';
            subTitle = 'Automated Portfolio Execution';
        } else if (reportType === 'SYNC') {
            headerTitle = 'Full Fund Sync Report';
            subTitle = 'Market Data Ingestion';
        } else if (reportType === 'AMFI_SYNC') {
            headerTitle = 'AMFI NAV Sync Report';
            subTitle = 'Official AMFI Text File Sync';
        }

        // --- COMPONENTS (Inline CSS Helpers) ---

        const StatCard = (label, value, color = colors.textPrimary, subtext = '') => `
            <td width="33%" style="padding: 0 8px;">
                <div style="background: ${colors.card}; border: 1px solid ${colors.border}; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="color: ${colors.textSecondary}; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">${label}</div>
                    <div style="color: ${color}; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">${value}</div>
                    ${subtext ? `<div style="color: ${colors.textSecondary}; font-size: 11px; margin-top: 4px;">${subtext}</div>` : ''}
                </div>
            </td>
        `;

        const StatusPill = (status) => {
            const isSuccess = status === 'SUCCESS';
            const bg = isSuccess ? colors.successBg : colors.errorBg;
            const text = isSuccess ? colors.successDark : colors.errorDark;
            return `<span style="background-color: ${bg}; color: ${text}; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">${status}</span>`;
        };

        // --- BUILD STATS ROW ---
        let statsRow = '';
        if (reportType === 'SCHEDULER') {
            statsRow = `
                ${StatCard('Executed', transactionCount, colors.textPrimary)}
                ${StatCard('Invested', formatMoney(totalInvested), colors.success, 'Total Deployment')}
                ${StatCard('Withdrawn', formatMoney(totalWithdrawn), '#D97706')} // Amber
             `;
        } else if (reportType === 'SYNC') {
            statsRow = `
                ${StatCard('Total Found', fundsFetched, colors.textPrimary)}
                ${StatCard('Funds Upserted', fundsInserted, '#3B82F6')} // Blue
                ${StatCard('NAV Records', navUpdated, colors.success)}
             `;
        } else if (reportType === 'AMFI_SYNC') {
            statsRow = `
                ${StatCard('Total Parsed', totalParsed, colors.textPrimary, 'From AMFI File')}
                ${StatCard('Matched Funds', matchedFunds, '#3B82F6', 'In Database')}
                ${StatCard('NAV Updated', navUpdated, colors.success, 'Records Added')}
             `;
        }

        // --- BUILD JOBS TABLE ---
        const jobRows = jobs.map((job, index) => {
            const isSuccess = job.status === 'SUCCESS';
            const duration = formatDuration(job.durationMs || 0);
            const borderStyle = index === jobs.length - 1 ? '' : `border-bottom: 1px solid ${colors.border};`;

            let detailsHtml = `<div style="color: ${colors.textSecondary}; font-size: 13px;">⏱️ Duration: ${duration}</div>`;

            if (job.errorDetails) {
                const shortError = job.errorDetails.split('\n')[0].substring(0, 120);
                detailsHtml += `<div style="margin-top: 8px; background: ${colors.errorBg}; color: ${colors.errorDark}; padding: 8px; border-radius: 6px; font-size: 12px; font-family: monospace;">⚠️ ${shortError}</div>`;
            }

            return `
                <tr>
                    <td style="padding: 20px; ${borderStyle}">
                        <div style="font-weight: 700; color: ${colors.textPrimary}; font-size: 15px;">${job.jobName}</div>
                    </td>
                    <td style="padding: 20px; text-align: center; ${borderStyle}">
                        ${StatusPill(job.status)}
                    </td>
                    <td style="padding: 20px; ${borderStyle}">
                        ${detailsHtml}
                    </td>
                </tr>
            `;
        }).join('');

        // --- ASSEMBLE HTML ---
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td style="padding: 40px 10px;" align="center">
                
                <!-- MAIN CONTAINER -->
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: ${colors.card}; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1);">
                    
                    <!-- HEADER -->
                    <tr>
                        <td style="background: ${colors.brandGradient}; padding: 40px 30px; text-align: center;">
                             <!-- Logo/Icon Placeholder -->
                             <div style="font-size: 40px; margin-bottom: 10px;">📊</div>
                             <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">${headerTitle}</h1>
                             <p style="margin: 8px 0 0; color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500;">${date} • ${subTitle}</p>
                        </td>
                    </tr>

                    <!-- STATS GRID -->
                    <tr>
                        <td style="padding: 30px;">
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>${statsRow}</tr>
                            </table>
                        </td>
                    </tr>

                    <!-- JOB LIST HEADER -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <h3 style="margin: 0 0 16px; color: ${colors.textPrimary}; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Detailed Execution Log</h3>
                        </td>
                    </tr>

                    <!-- JOB LIST -->
                    <tr>
                        <td style="padding: 0 30px 40px;">
                            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border: 1px solid ${colors.border}; border-radius: 12px; overflow: hidden;">
                                <thead style="background: #F8FAFC;">
                                    <tr>
                                        <th style="padding: 12px 20px; text-align: left; font-size: 11px; color: ${colors.textSecondary}; text-transform: uppercase;">Job Name</th>
                                        <th style="padding: 12px 20px; text-align: center; font-size: 11px; color: ${colors.textSecondary}; text-transform: uppercase;">Status</th>
                                        <th style="padding: 12px 20px; text-align: left; font-size: 11px; color: ${colors.textSecondary}; text-transform: uppercase;">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${jobRows}
                                </tbody>
                            </table>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td style="background: #F1F5F9; padding: 24px; text-align: center;">
                            <p style="margin: 0; color: ${colors.textSecondary}; font-size: 12px;">This is an automated system report generated by <strong>MF Selection Engine</strong>.</p>
                            <div style="margin-top: 12px; display: inline-block;">
                                <span style="display:inline-block; width: 6px; height: 6px; background: ${colors.success}; border-radius: 50%; margin-right: 6px;"></span>
                                <span style="font-size: 11px; color: ${colors.textSecondary}; font-weight: 600;">System Healthy</span>
                            </div>
                        </td>
                    </tr>
                
                </table>
                <!-- END CONTAINER -->
                
                <p style="text-align: center; margin-top: 24px; color: #94A3B8; font-size: 11px;">
                    © ${new Date().getFullYear()} MF Investments. All rights reserved.
                </p>

            </td>
        </tr>
    </table>
</body>
</html>
        `;

        const subject = failedCount > 0
            ? `⚠️ Alert: ${headerTitle} Issues Detected`
            : `✅ Success: ${headerTitle}`;

        try {
            const info = await this.transporter.sendMail({
                from: `"MF System Brain" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: recipient,
                subject,
                html
            });

            logger.info(`[EmailService] Cron report sent to ${recipient}. MessageId: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error(`[EmailService] Failed to send cron report:`, error.message);
            return false;
        }
    }

    /**
     * Send Support Ticket Email (Report Issue Feature)
     * @param {Object} ticketData - Ticket data
     * @param {string} ticketData.userName - User's full name
     * @param {string} ticketData.userEmail - User's email
     * @param {string} ticketData.issueType - Bug, Feedback, Other
     * @param {string} ticketData.description - Issue description
     */
    async sendSupportTicket(ticketData) {
        if (!this.initialized) this.init();

        const { userName, userEmail, issueType, description } = ticketData;
        const supportEmail = 'Support@trymutualfunds.com';

        // Format description for HTML (preserve newlines)
        const formattedDescription = description ? description.replace(/\n/g, '<br>') : '';

        if (!this.transporter) {
            logger.info(`[EmailService] MOCK: Would send support ticket to ${supportEmail}`);
            logger.info(`[EmailService] From: ${userName} (${userEmail})`);
            logger.info(`[EmailService] Type: ${issueType}`);
            logger.info(`[EmailService] Description: ${description}`);
            return true;
        }

        const typeEmoji = issueType === 'Bug' ? '🐞' : issueType === 'Feedback' ? '💡' : '📝';

        const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px;">
            <div style="background: linear-gradient(135deg, #10B981, #14B8A6); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                <h2 style="margin: 0; color: white;">${typeEmoji} New Support Ticket</h2>
            </div>
            <div style="background: #F9FAFB; padding: 20px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
                <p><strong>From:</strong> ${userName}</p>
                <p><strong>Email:</strong> <a href="mailto:${userEmail}">${userEmail}</a></p>
                <p><strong>Type:</strong> ${issueType}</p>
                <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 16px 0;">
                <p><strong>Description:</strong></p>
                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; white-space: pre-wrap;">
${formattedDescription}
                </div>
            </div>
            <p style="font-size: 12px; color: #6B7280; margin-top: 20px; text-align: center;">
                Submitted via TryMutualFunds Report Issue Form
            </p>
        </div>
        `;

        try {
            const info = await this.transporter.sendMail({
                from: `"TryMutualFunds Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: supportEmail,
                replyTo: userEmail,
                subject: `${typeEmoji} [${issueType}] Support Ticket from ${userName}`,
                html
            });

            logger.info(`[EmailService] Support ticket sent. MessageId: ${info.messageId}`);
            return { success: true };
        } catch (error) {
            logger.error(`[EmailService] Failed to send support ticket: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

export const emailService = new EmailService();
