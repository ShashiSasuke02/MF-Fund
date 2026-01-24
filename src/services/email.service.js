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
}

export const emailService = new EmailService();
