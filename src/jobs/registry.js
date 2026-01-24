
/**
 * Cron Job Registry
 * Central repository for all cron jobs in the system
 */
export class CronJobRegistry {
    constructor() {
        this.jobs = new Map();
    }

    /**
     * Register a new job
     * @param {string} name - Unique job name
     * @param {string} schedule - Cron expression
     * @param {Function} handler - Job execution function
     */
    register(name, schedule, handler) {
        if (this.jobs.has(name)) {
            console.warn(`[CronRegistry] Overwriting existing job: ${name}`);
        }
        this.jobs.set(name, {
            name,
            schedule,
            handler,
            isRunning: false
        });
        console.log(`[CronRegistry] Registered job: ${name} (${schedule})`);
    }

    /**
     * Get a job definition
     * @param {string} name 
     * @returns {Object}
     */
    getJob(name) {
        return this.jobs.get(name);
    }

    /**
     * Get all registered jobs
     * @returns {Array}
     */
    getAllJobs() {
        return Array.from(this.jobs.values());
    }
}

// Singleton instance
export const cronRegistry = new CronJobRegistry();
