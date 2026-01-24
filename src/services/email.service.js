import nodemailer from 'nodemailer';

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.warn('[EmailService] SMTP credentials missing. Email sending disabled.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                timeout: 10000 // 10 seconds timeout
            }
        });

        this.initialized = true;
        console.log('[EmailService] Initialized with host:', process.env.SMTP_HOST);
    }

    /**
     * Send OTP email
     * @param {string} toEmail 
     * @param {string} otp 
     */
    async sendOTP(toEmail, otp) {
        if (!this.initialized) this.init();

        if (!this.transporter) {
            console.log(`[EmailService] MOCK SEND: OTP for ${toEmail} is ${otp}`);
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

            console.log(`[EmailService] OTP sent to ${toEmail}. MessageId: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`[EmailService] Failed to send OTP to ${toEmail}:`, error.message);
            // Don't throw, just return false so registration flow handles it gracefully
            return false;
        }
    }

    /**
     * Send Cron Job Report Email
     * @param {Object} reportData - Report data
     * @param {string} reportData.recipient - Email recipient
     * @param {string} reportData.date - Report date
     * @param {Array} reportData.jobs - Array of job results
     * @param {number} reportData.totalDuration - Total duration in ms
     * @param {number} reportData.successCount - Number of successful jobs
     * @param {number} reportData.failedCount - Number of failed jobs
     * @param {number} reportData.transactionCount - Total transactions processed
     */
    async sendCronJobReport(reportData) {
        if (!this.initialized) this.init();

        if (!this.transporter) {
            console.log('[EmailService] MOCK: Would send cron report to', reportData.recipient);
            console.log('[EmailService] Report Data:', JSON.stringify(reportData, null, 2));
            return true;
        }

        const { recipient, date, jobs, totalDuration, successCount, failedCount, transactionCount } = reportData;

        // Format duration
        const formatDuration = (ms) => {
            if (ms < 1000) return `${ms}ms`;
            if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
            return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
        };

        // Build job rows
        const jobRows = jobs.map(job => {
            const statusIcon = job.status === 'SUCCESS' ? '✅' : job.status === 'FAILED' ? '❌' : '⏳';
            const statusColor = job.status === 'SUCCESS' ? '#10B981' : job.status === 'FAILED' ? '#EF4444' : '#F59E0B';
            const duration = formatDuration(job.durationMs || 0);

            let details = `Duration: ${duration}`;
            if (job.jobName === 'Daily Transaction Scheduler' && job.result) {
                const executed = job.result.executed || 0;
                details += ` | Transactions: ${executed}`;
            }
            if (job.jobName.includes('Fund Sync') && job.result) {
                const navs = job.result.navInserted || job.result.inserted || 0;
                if (navs > 0) details += ` | Records: ${navs}`;
            }

            let errorHtml = '';
            if (job.status === 'FAILED' && job.errorDetails) {
                const shortError = job.errorDetails.split('\\n')[0].substring(0, 100);
                errorHtml = `<div style="color: #EF4444; font-size: 12px; margin-top: 4px;">⚠️ ${shortError}</div>`;
            }

            return `
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB;">
                        <div style="display: flex; align-items: center;">
                            <span style="font-size: 18px; margin-right: 8px;">${statusIcon}</span>
                            <span style="font-weight: 600; color: #1F2937;">${job.jobName}</span>
                        </div>
                        ${errorHtml}
                    </td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; text-align: center;">
                        <span style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
                            ${job.status}
                        </span>
                    </td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">
                        ${details}
                    </td>
                </tr>
            `;
        }).join('');

        const overallStatus = failedCount > 0 ? '⚠️ Issues Detected' : '✅ All Jobs Successful';
        const headerColor = failedCount > 0 ? '#F59E0B' : '#10B981';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${headerColor} 0%, #0D9488 100%); border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 600;">📊 Nightly Batch Process Report</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${date}</p>
        </div>

        <!-- Status Summary -->
        <div style="background: white; padding: 20px 24px; border-bottom: 1px solid #E5E7EB;">
            <div style="display: flex; justify-content: space-between; text-align: center;">
                <div style="flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #10B981;">${successCount}</div>
                    <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Successful</div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #EF4444;">${failedCount}</div>
                    <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Failed</div>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 24px; font-weight: 700; color: #6366F1;">${transactionCount}</div>
                    <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">Transactions</div>
                </div>
            </div>
        </div>

        <!-- Job Details Table -->
        <div style="background: white; padding: 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #F9FAFB;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Job</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Status</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobRows}
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div style="background: #F9FAFB; border-radius: 0 0 12px 12px; padding: 16px 24px; text-align: center;">
            <p style="margin: 0; color: #6B7280; font-size: 13px;">
                Total Run Time: <strong>${formatDuration(totalDuration)}</strong> | 
                Report Generated: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
            </p>
            <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 11px;">
                TryMutualFunds - Automated Cron Job Monitor
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const subject = failedCount > 0
            ? `⚠️ Cron Jobs Report - ${failedCount} Failed - ${date}`
            : `✅ Cron Jobs Report - All Successful - ${date}`;

        try {
            const info = await this.transporter.sendMail({
                from: `"TryMutualFunds Cron" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: recipient,
                subject,
                html
            });

            console.log(`[EmailService] Cron report sent to ${recipient}. MessageId: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`[EmailService] Failed to send cron report:`, error.message);
            return false;
        }
    }
}

export const emailService = new EmailService();

