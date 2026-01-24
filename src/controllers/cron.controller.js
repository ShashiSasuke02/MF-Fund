
import { cronRegistry, triggerJobManually } from '../jobs/scheduler.job.js'; // Import trigger from scheduler.job.js to wrap execution
import { cronJobLogModel } from '../models/cronJobLog.model.js';

export const cronController = {
    /**
     * List all registered jobs with current status
     */
    async listJobs(req, res) {
        try {
            const allJobs = cronRegistry.getAllJobs();

            const jobsWithLastRun = await Promise.all(allJobs.map(async (job) => {
                const lastRun = await cronJobLogModel.getLastRun(job.name);
                return {
                    name: job.name,
                    schedule: job.schedule,
                    isEnabled: job.isRunning, // Simplified status
                    lastRun: lastRun ? {
                        status: lastRun.status,
                        startTime: lastRun.start_time,
                        endTime: lastRun.end_time,
                        duration: lastRun.duration_ms,
                        triggeredBy: lastRun.triggered_by
                    } : null
                };
            }));

            res.json({ success: true, jobs: jobsWithLastRun });
        } catch (error) {
            console.error('List jobs error:', error);
            res.status(500).json({ error: 'Failed to list cron jobs' });
        }
    },

    /**
     * Manually trigger a specific job
     */
    async triggerJob(req, res) {
        const { jobName } = req.body;

        if (!jobName) {
            return res.status(400).json({ error: 'Job name is required' });
        }

        try {
            // We don't await the result to avoid blocking the response for long jobs.
            // But user wants to know if it started successfully.
            // triggerJobManually is async. We can await it if we want "synchronous" feedback, 
            // but typically "Run Now" triggers background processing.
            // However, the requirement "Execute duration and success/failure logs" implies we want to see it.
            // Let's await it so the frontend gets immediate success/fail, 
            // OR return "Started" and let frontend poll. 
            // Given the "Run Now" usually implies "Fire and Forget" or "Wait for finish" depending on UX.
            // Let's NOT await full completion if it's long, but for simpler debugging, awaiting is easier.
            // BUT, fund sync takes minutes. Timeout will happen.
            // SO: Fire and forget, return "Job triggered".

            triggerJobManually(jobName).catch(err => console.error(`Manual trigger failed in bg: ${jobName}`, err));

            res.json({ success: true, message: `Job '${jobName}' triggered successfully.` });
        } catch (error) {
            // If it throws immediately (e.g. job not found), catch here
            res.status(404).json({ error: error.message });
        }
    },

    /**
     * Get execution history for a job
     */
    async getJobHistory(req, res) {
        const { jobName } = req.params;
        const limit = parseInt(req.query.limit) || 20;

        try {
            const logs = await cronJobLogModel.getLogsByJob(jobName, limit);
            res.json({ success: true, logs });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch job history' });
        }
    }
};
