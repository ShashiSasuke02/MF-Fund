# Project Plan: Automated AMFI NAV Sync

## 1. Goal
Schedule the **AMFI NAV Sync** to run automatically and independently, ensuring NAVs are updated daily even if the "Full Fund Sync" (metadata sync) is disabled or fails.

## 2. Current State
- **File:** `src/jobs/scheduler.job.js`
- **Behavior:**
    1.  `Full Fund Sync` runs at 01:00 AM.
    2.  `AMFI NAV Sync` is triggered *inside* the `Full Fund Sync` handler (chained).
    3.  If `ENABLE_FULL_SYNC=false`, the AMFI Sync never runs automatically.

## 3. Proposed Changes

### Strategy: Redundant Triggering
We will use a **"Belt and Suspenders"** approach to ensure NAV data is always up-to-date.

1.  **Retain Chaining:** The `Full Fund Sync` (metadata) will **continue** to trigger `AMFI NAV Sync` immediately upon completion.
    -   *Benefit:* Ensures immediate consistency. New funds added in Full Sync get their NAVs populated right away.
2.  **Add Independent Schedule:** Register `AMFI NAV Sync` as a standalone scheduled job running **twice daily**:
    -   **11:00 PM IST:** To capture early updates.
    -   **05:00 AM IST:** To ensure late-night updates are processed before the market opens.
    -   *Cron Expression:* `0 5,23 * * *` (Runs at hours 5 and 23).
    -   *Benefit:* Reliability and Timeliness. Ensures data is fresh for both late-night users and early morning reports.
3.  **Concurrency/Redundancy:**
    -   If both run, the sync happens twice (`~01:05` and `02:00`).
    -   *Impact:* Acceptable. The AMFI Sync is lightweight (downloading a public text file) and idempotent (upserting latest data). Redundancy is preferred over stale data.

### Configuration
-   `ENABLE_AMFI_SYNC_SCHEDULE` (default: `true`): Controls the 02:00 AM independent run.
-   Run `AMFI Sync` logic:
    ```javascript
    if (job.name === 'AMFI NAV Sync' && process.env.ENABLE_AMFI_SYNC_SCHEDULE === 'false') {
        isEnabled = false;
    }
    ```

## 4. Implementation Steps
1.  **Modify `src/jobs/scheduler.job.js`**:
    -   **Keep** `amfiSyncService.runSync()` inside the Full Sync block.
    -   **Add** a new independent registration for `AMFI NAV Sync` with schedule `'0 5,23 * * *'`.
    -   Add environment variable check for the new schedule.
2.  **Update `docker-compose.yml`**:
    -   Add `ENABLE_AMFI_SYNC_SCHEDULE: "true"` to backend environment.
3.  **Update `ARCHITECTURE.md`**:
    -   Document the new isolated schedule.

## 5. Verification
-   Review `src/jobs/scheduler.job.js` logic.
-   (Optional) Dry-run script to test the cron registration logic? (Not strictly needed if code is clear).
