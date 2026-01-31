
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('--- Email Diagnosis ---');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('From:', process.env.SMTP_FROM);

async function testEmail() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.error('❌ Missing credentials in .env');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            timeout: 10000
        },
        debug: true // Enable debug output
    });

    try {
        console.log('1. Testing Connection (verify)...');
        await transporter.verify();
        console.log('✅ Connection Verified!');

        console.log('2. Sending Test Email...');
        const info = await transporter.sendMail({
            from: `"Test" <${process.env.SMTP_FROM}>`,
            to: process.env.SMTP_FROM, // Send to self
            subject: 'Test Email from Diagnosis Script',
            text: 'If you see this, SMTP is working.'
        });
        console.log('✅ Email Sent! Message ID:', info.messageId);

    } catch (error) {
        console.error('❌ FAILED:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        if (error.response) console.error('Response:', error.response);
    }
}

testEmail();
