
### 15.9 Automated AMFI NAV Sync (Feb 2026)

#### Feature
Automated the **AMFI NAV Sync** to run independently of the Full Fund Sync, ensuring data freshness even if metadata syncs are disabled or fail.

#### Schedule
-   **Trigger 1:** Immediately after `Full Fund Sync` (Chained).
-   **Trigger 2:** Scheduled at **11:00 PM IST** and **05:00 AM IST** (`0 5,23 * * *`).

#### Configuration
-   **New Variable:** `ENABLE_AMFI_SYNC_SCHEDULE` (Default: `true`).
-   To disable the independent schedule: Set `ENABLE_AMFI_SYNC_SCHEDULE=false` in `.env` or `docker-compose.yml`.

#### Files Modified
-   `src/jobs/scheduler.job.js`
-   `docker-compose.yml`
-   `Dockerfile` (Added `TZ=Asia/Kolkata`)
