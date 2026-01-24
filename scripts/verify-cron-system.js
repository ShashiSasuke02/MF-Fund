
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:4000'; // Adjust if different
const email = 'admin@example.com'; // Use a valid admin account if known
const password = 'adminpassword';

async function verify() {
    try {
        console.log('--- Cron System Verification ---');

        // 1. In a real environment we would login. 
        // For this test, user already has admin access if the app is running.
        // We'll try to reach the endpoint.

        // Note: This script assumes the server is running.
        // If I can't guarantee the server is up, I can test the registry directly.

        console.log('Testing Job Registry initialization...');
        const { initSchedulerJobs, cronRegistry } = await import('../src/jobs/scheduler.job.js');
        const { cronRegistry: registry } = await import('../src/jobs/registry.js');

        initSchedulerJobs();
        const jobs = registry.getAllJobs();
        console.log(`Registered jobs found: ${jobs.length}`);
        jobs.forEach(j => console.log(` - ${j.name}: ${j.schedule}`));

        if (jobs.length > 0) {
            console.log('✅ Registry verification PASSED.');
        } else {
            console.log('❌ Registry verification FAILED (No jobs registered).');
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verify();
