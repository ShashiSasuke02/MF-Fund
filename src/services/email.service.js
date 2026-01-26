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
     */
    async sendCronJobReport(reportData) {
        if (!this.initialized) this.init();

        if (!this.transporter) {
            console.log('[EmailService] MOCK: Would send cron report to', reportData.recipient);
            // console.log('[EmailService] Report Data:', JSON.stringify(reportData, null, 2));
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
            fundsInserted,
            navUpdated,
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

        const totalInvestedStr = formatMoney(totalInvested);
        const totalWithdrawnStr = formatMoney(totalWithdrawn);

        // Format duration
        const formatDuration = (ms) => {
            if (ms < 1000) return `${ms}ms`;
            if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
            return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
        };

        // Determine Header Title
        let headerTitle = 'Nightly Batch Process Report';
        if (reportType === 'SCHEDULER') headerTitle = 'Daily Transaction Report';
        if (reportType === 'SYNC') headerTitle = 'Full Fund Sync Report';

        // Build Summary Cards HTML
        let cardsHtml = '';

        if (reportType === 'SCHEDULER') {
            cardsHtml = `
            <div style="display: flex; gap: 12px; justify-content: space-between;">
                <!-- Invested Card -->
                <div style="flex: 1; background: #ECFDF5; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #D1FAE5;">
                    <div style="color: #059669; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Invested</div>
                    <div style="color: #047857; font-size: 18px; font-weight: 800;">${totalInvestedStr}</div>
                </div>
                <!-- Withdrawn Card -->
                <div style="flex: 1; background: #FFFBEB; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #FEF3C7;">
                    <div style="color: #D97706; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Withdrawn</div>
                    <div style="color: #B45309; font-size: 18px; font-weight: 800;">${totalWithdrawnStr}</div>
                </div>
                <!-- Failed Card -->
                <div style="flex: 1; background: ${failedCount > 0 ? '#FEF2F2' : '#F3F4F6'}; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid ${failedCount > 0 ? '#FEE2E2' : '#E5E7EB'};">
                     <div style="color: ${failedCount > 0 ? '#DC2626' : '#6B7280'}; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Failed</div>
                    <div style="color: ${failedCount > 0 ? '#B91C1C' : '#374151'}; font-size: 18px; font-weight: 800;">${failedCount}</div>
                </div>
            </div>`;
        } else if (reportType === 'SYNC') {
            cardsHtml = `
            <div style="display: flex; gap: 12px; justify-content: space-between;">
                <!-- Funds Inserted Card -->
                <div style="flex: 1; background: #EFF6FF; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #DBEAFE;">
                    <div style="color: #2563EB; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Funds Inserted</div>
                    <div style="color: #1E40AF; font-size: 18px; font-weight: 800;">${fundsInserted || 0}</div>
                </div>
                <!-- NAVs Updated Card -->
                <div style="flex: 1; background: #ECFDF5; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #D1FAE5;">
                    <div style="color: #059669; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">NAVs Updated</div>
                    <div style="color: #047857; font-size: 18px; font-weight: 800;">${navUpdated || 0}</div>
                </div>
                <!-- Errors Card -->
                 <div style="flex: 1; background: ${failedCount > 0 ? '#FEF2F2' : '#F3F4F6'}; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid ${failedCount > 0 ? '#FEE2E2' : '#E5E7EB'};">
                     <div style="color: ${failedCount > 0 ? '#DC2626' : '#6B7280'}; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">Errors</div>
                    <div style="color: ${failedCount > 0 ? '#B91C1C' : '#374151'}; font-size: 18px; font-weight: 800;">${failedCount}</div>
                </div>
            </div>`;
        }

        // Build job rows
        const jobRows = jobs.map(job => {
            const isSuccess = job.status === 'SUCCESS';
            const statusColor = isSuccess ? '#D1FAE5' : '#FEE2E2'; // Green-100 : Red-100
            const statusTextColor = isSuccess ? '#065F46' : '#991B1B'; // Green-800 : Red-800
            const duration = formatDuration(job.durationMs || 0);

            let details = `⏱️ ${duration}`;

            // Financial Details for Scheduler
            if (job.jobName === 'Daily Transaction Scheduler' && job.result) {
                const executed = job.result.executed || 0;
                details = `<div style="margin-bottom: 4px;"><strong>${executed}</strong> Transactions Processed</div>`;

                if (job.result.totalInvested > 0) {
                    details += `<div style="color: #059669;">⬆️ Invested: <strong>${formatMoney(job.result.totalInvested)}</strong></div>`;
                }
                if (job.result.totalWithdrawn > 0) {
                    details += `<div style="color: #D97706;">⬇️ Withdrawn: <strong>${formatMoney(job.result.totalWithdrawn)}</strong></div>`;
                }
            }

            // Stats Details for Full Fund Sync
            if (job.jobName === 'Full Fund Sync' && job.result) {
                const inserted = job.result.inserted || 0;
                const navs = job.result.navInserted || 0;
                details = `<div style="margin-bottom: 4px;"><strong>${inserted}</strong> Funds Upserted</div>
                           <div style="color: #059669;"><strong>${navs}</strong> NAV Records</div>`;
                if (job.result.skippedInactive) details += `<div style="color: #6B7280; font-size: 10px;">Skipped Inactive: ${job.result.skippedInactive}</div>`;
            }

            let errorHtml = '';
            if (job.status === 'FAILED' && job.errorDetails) {
                const shortError = job.errorDetails.split('\\n')[0].substring(0, 100);
                errorHtml = `<div style="color: #DC2626; font-size: 11px; margin-top: 6px; background: #FEF2F2; padding: 4px; border-radius: 4px;">⚠️ ${shortError}</div>`;
            }

            return `
                <tr>
                    <td style="padding: 16px; border-bottom: 1px solid #F3F4F6;">
                        <div style="font-weight: 600; color: #1F2937; font-size: 14px;">${job.jobName}</div>
                        ${errorHtml}
                    </td>
                    <td style="padding: 16px; border-bottom: 1px solid #F3F4F6; text-align: center;">
                        <span style="background-color: ${statusColor}; color: ${statusTextColor}; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                            ${job.status}
                        </span>
                    </td>
                    <td style="padding: 16px; border-bottom: 1px solid #F3F4F6; color: #4B5563; font-size: 13px; line-height: 1.4;">
                        ${details}
                    </td>
                </tr>
            `;
        }).join('');

        const headerColorStart = failedCount > 0 ? '#EF4444' : '#4F46E5'; // Red or Indigo
        const headerColorEnd = failedCount > 0 ? '#B91C1C' : '#4338CA';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, ${headerColorStart} 0%, ${headerColorEnd} 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${headerTitle}</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">${date}</p>
        </div>

        <!-- Summary Cards -->
        <div style="padding: 24px; background: #FFFFFF; border-bottom: 1px solid #F3F4F6;">
            ${cardsHtml}
        </div>

        <!-- Table -->
        <div style="padding: 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Job Name</th>
                        <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Status</th>
                        <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobRows}
                </tbody>
            </table>
        </div>

        <!-- Footer -->
        <div style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                Generated automatically by TryMutualFunds Scheduler.
            </p>
            <p style="margin: 4px 0 0; color: #D1D5DB; font-size: 11px;">
                ${new Date().getFullYear()} © All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const subject = failedCount > 0
            ? `⚠️ ${headerTitle} - Issues Detected (${date})`
            : `✅ ${headerTitle} - Successful (${date})`;

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
