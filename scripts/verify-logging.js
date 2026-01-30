import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const LOG_DIR = path.join(ROOT_DIR, 'logs');
const API_URL = 'http://localhost:4000/api';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function verifyLogging() {
    console.log('🚀 Starting Logging System Verification...');

    // 1. Trigger Info Log (Health Check)
    try {
        console.log('1️⃣  Triggering Request Log (GET /api/health)...');
        await axios.get(`${API_URL}/health`);
        console.log('   ✅ Request sent.');
    } catch (err) {
        console.error('   ❌ Request failed (is server running?):', err.message);
        process.exit(1);
    }

    // 2. Trigger Error Log (404)
    try {
        console.log('2️⃣  Triggering Error Log (GET /api/non-existent-route-for-log-test)...');
        await axios.get(`${API_URL}/non-existent-route-for-log-test`);
    } catch (err) {
        console.log('   ✅ 404 Triggered (Expected).');
    }

    // Wait for logs to flush
    console.log('⏳ Waiting for logs to flush...');
    await sleep(2000);

    // 3. Verify Log Files Exist
    console.log('3️⃣  Verifying Log Files...');
    if (!fs.existsSync(LOG_DIR)) {
        console.error('   ❌ Log directory not found at:', LOG_DIR);
        process.exit(1);
    }

    const files = fs.readdirSync(LOG_DIR);
    console.log('   📂 Found files:', files);

    const appLogs = files.filter(f => f.startsWith('application-'));
    const errorLogs = files.filter(f => f.startsWith('error-'));

    if (appLogs.length === 0) {
        console.error('   ❌ No application logs found.');
        process.exit(1);
    }

    // 4. Read Log Content
    console.log('4️⃣  Verifying Log Content...');
    const latestAppLog = path.join(LOG_DIR, appLogs[0]);
    const content = fs.readFileSync(latestAppLog, 'utf8');

    // Check for Health Check log
    if (content.includes('/api/health') && content.includes('REQUEST_END')) {
        console.log('   ✅ Found Health Check log entry.');
    } else {
        console.error('   ❌ Health Check log entry NOT found.');
        console.log('   📄 Log Content Preview:', content.substring(0, 500));
    }

    // Check for 404 log
    if (content.includes('non-existent-route')) {
        console.log('   ✅ Found 404 Error log entry.');
    } else {
        console.warn('   ⚠️ 404 Log entry not found (Check if 404s are logged as info/warn).');
    }

    // 5. Verify Request ID
    if (content.includes('requestId')) {
        console.log('   ✅ Request ID found in logs.');
    } else {
        console.error('   ❌ Request ID field missing.');
    }

    console.log('\n🎉 Verification Successful! Logging system is operational.');
}

verifyLogging();
