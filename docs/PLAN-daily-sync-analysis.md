# Daily Sync & Scheduler Analysis

## 1. System Overview
The application maintains a dual-scheduler system to handle mutual fund data synchronization and user transaction processing independently. These are orchestrated via `node-cron` in `src/jobs/scheduler.job.js`.

### Core Schedules
| Job Name | Schedule (Cron) | Time (Approx) | Purpose |
|----------|----------------|---------------|---------|
| **Full Fund Sync** | `30 2 0 * * *` | 02:30 AM IST | Fetches master fund data & latest NAVs from MFAPI. |
| **Daily Transaction Scheduler** | `0 6 * * *` | 06:00 AM IST | Executes SIP/SWP transactions for the day using local DB data. |
| **Incremental Fund Sync** | `0 10,12,14 * * *` | 10 AM, 12 PM, 2 PM | Updates NAVs for active funds during market hours. |

---

## 2. Detailed Workflow Analysis

### A. Full Fund Sync (02:30 AM)
**File:** `src/services/mfapiIngestion.service.js` (`runFullSync`)

1.  **Optimization Strategy**:
    *   Does **not** query each fund individually.
    *   Calls `GET https://api.mfapi.in/mf/latest` once to get ~2,000+ funds with their latest NAVs.

2.  **Filtering Pipeline**:
    *   **Active Check**: Discards funds with no NAV update in the current month.
    *   **Whitelist Enforcment**: Filters for 12 key AMCs (SBI, ICICI, HDFC, Nippon, Kotak, ABSL, UTI, Axis, Tata, Mirae, DSP, Bandhan).
    *   **Exclusions**: Removes schemes with "IDCW" or "Dividend" in the name/category (Growth/Agrowth focus).

3.  **Data Persistence**:
    *   **Batch Processing**: Upserts funds in batches of 100 to `funds` table.
    *   **NAV History**: Inserts latest NAV into `fund_nav_history`.
    *   **Retention**: Auto-deletes NAV records older than 30 days per fund.

4.  **Housekeeping**:
    *   Scans database for funds with no NAV updates for >7 days and marks `is_active = false`.

### B. Daily Transaction Scheduler (06:00 AM)
**File:** `src/services/scheduler.service.js` (`executeDueTransactions`)

1.  **Local-First Architecture**:
    *   Does **not** call external APIs.
    *   Relies entirely on NAVs synced to the local database at 02:30 AM.

2.  **Execution Logic**:
    *   **Batch Fetch**: Finds all `transactions` where `status = 'PENDING'` (or `RECURRING` for SIPs) AND `next_execution_date <= Today`.
    *   **Concurrency Lock**: Uses `is_locked` flag to prevent double execution.
    *   **SIP Execution**: Checks user balance vs `demo_accounts` -> Deducts Balance -> Adds Units via `holdingModel`.
    *   **SWP Execution**: Checks unit balance -> Redeems Units -> Credits Balance.

3.  **Status Transition**:
    *   **SIP**: Remains `RECURRING` until end date.
    *   **SWP/Lumpsum**: Moves to `SUCCESS` after execution.
    *   **Failures**: Updates to `PENDING` (retry) logic + sends failure notification.

4.  **Notifications**:
    *   On Success: Sends "Wealth Builder Alert" (SIP) or "Passive Income Alert" (SWP).
    *   On Failure: Sends "Action Needed" alert (e.g., Low Balance).

### C. Reporting & Monitoring
**File:** `src/services/cronNotification.service.js`

*   **Trigger**: Runs automatically after jobs complete.
*   **Method**: Sends an email via `emailService` if `ENABLE_CRON_REPORTS=true` (Env var).
*   **Content**: Execution duration, success/fail counts, and specific stats (e.g., "Total Invested: ₹50,000").

---

## 3. Configuration & Control

*   **Environment Variables**:
    *   `ENABLE_FULL_SYNC`: Toggle Sync Job.
    *   `ENABLE_INCREMENTAL_SYNC`: Toggle Intraday Sync.
    *   `MFAPI_BATCH_SIZE`: Controls ingestion batching (default 10).
    *   `CRON_REPORT_EMAIL`: Recipient for daily logs.

*   **Manual Triggers**:
    *   Jobs can be triggered manually via `scheduler.job.js` -> `triggerJobManually('Full Fund Sync')` (useful for Admin Dashboard).

---

## 4. Observations & Recommendations

1.  **Robustness**: The separation of `Sync` (2:30 AM) and `Execution` (6:00 AM) is excellent. It ensures transactions always have the latest data without waiting for APIs during execution.
2.  **UTC vs IST**: Code comments mention potential timezone confusion ("Standard cron doesn't do TZ easily without option"). Currently, it relies on the server time being roughly aligned or the offset `30 2 0` (UTC) = `08:00 AM IST`?
    *   *Correction*: `30 2 0 * * *` is 02:30 UTC = 08:00 AM IST. Wait, if the comment says "2:00 AM IST = 30 20 * * * UTC", that implies a specific offset.
    *   **Current Code**: `30 2 0 * * *` -> If Server is UTC: 02:30 AM UTC = 08:00 AM IST. If Server is IST (Local): 02:30 AM IST.
    *   **Recommendation**: verify server timezone in Dockerfile.

3.  **Fail-Safes**: The "Stop Conditions" logic (End Date, Installment Limits) is correctly implemented in `schedulerService`.

## 5. Next Steps (Optional)
*   **Admin Dashboard**: Expose the `fund_sync_log` table in the UI to visualize sync health.
*   **Retry Logic**: If 2:30 AM sync fails, the 6:00 AM scheduler will run on *yesterday's* NAVs. Consider a "Health Check" in the scheduler to pause if NAVs are stale (>24h).
