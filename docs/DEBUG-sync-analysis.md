# 🔍 Debug: Sync Latency & AMC Duplicates

## 1. Symptom
- **NAV Latency:** After "Full Fund Sync", NAVs are not updated to the latest date on the application.
- **AMC Duplicates:** "Incremental Sync" usage reportedly leads to duplicate AMCs on the AMC List page, requiring `fix-amc-duplicates.js` to resolve.

## 2. Investigation Findings

### A. AMC Duplicates
- **Observation:** `AmcList.jsx` displays data directly from the `amc_master` table via `amcController.getAll`.
- **Code Audit:** A global search for `amcModel.create` and `INSERT INTO amc_master` confirmed that **NO application code** (including `mfapiIngestion.service.js`) inserts into `amc_master`.
- **Root Cause:** A conflict exists between the predefined seed data:
    - `src/db/schema.sql`: Seeds `amc_master` with **Long Names** (e.g., PK=`'SBI Mutual Fund'`).
    - `scripts/fix-amc-duplicates.js`: Seeds `amc_master` with **Short Names** (e.g., PK=`'SBI'`).
- **Scenario:** If the database is initialized with `schema.sql` (giving 'SBI Mutual Fund') and then `fix-amc-duplicates.js` is run (or partially run/failed) or another script inserts 'SBI', duplicate entries appear because the Primary Keys differ.
- **Why it seems linked to Sync:** It is likely a coincidence or a side effect of running maintenance scripts around the same time. The "Incremental Sync" logic (`runIncrementalSync`) purely updates `funds` and `fund_nav_history` tables and **never** touches `amc_master`.

### B. NAV Update Latency
- **Observation:** "Full Fund Sync" updates are not reflected immediately.
- **Full Sync Logic (`runFullSync`):**
    - Uses `/mf/latest` endpoint from MFAPI.
    - Filters funds using a 45-day window (`filterByCurrentMonth`).
    - Updates `funds` table metadata.
    - Updates `fund_nav_history` table with NAV from the response.
- **The Issue:**
    - The `funds` table does **NOT** have a `nav` or `last_nav_date` column (Confirmed in `schema.sql`).
    - The UI (`AmcList`, `FundDetails`) fetches NAVs by joining with `fund_nav_history`.
    - If `/mf/latest` returns stale data (e.g., yesterday's NAV vs today's), the "Full Sync" will upsert that stale NAV.
    - "Incremental Sync" works better because it calls `/mf/:code/latest` for each active fund, which often has fresher data than the bulk `/mf/latest` endpoint.
- **Conclusion:** The latency is likely due to the upstream `/mf/latest` endpoint being slightly behind real-time compared to individual fund endpoints.

### C. Log Analysis Findings
- **Log Source:** `logs/application-2026-02-03.log` (25KB) & `logs/application-2026-02-04.log` (Empty).
- **Missing Sync Logs:** The available logs show Scheduler activity (transactions) but **do not contain** any `[MFAPI Ingestion]` entries.
- **Implication:** The "Full Fund Sync" (Scheduled 1:00 AM IST) did not run or was not captured in these specific log files. This explains why the data is stale—the sync simply didn't happen, or the process was down at that time.
- **Conclusion:** Alongside the logic fix, we must ensure the `scheduler.job.js` is actually active and running in the deployed environment.

### D. Email Notification Findings (Zero Stats)
- **Symptom:** User received "0 0 0" stats email.
- **Root Cause:** In `src/services/cronNotification.service.js` (lines 151-161), the code expects flat properties (e.g., `result.totalFetched`). However, `scheduler.job.js` returns a nested object: `{ fullSync: {...}, incrementalSync: {...} }`.
- **Conclusion:** The sync *might* have run successfully (or failed), but the email simply failed to read the stats correctly. The "0" values are default fallbacks, not necessarily real data.

## 3. Solution Strategy

### Fix 1: Resolve AMC Duplicates Permanently
- **Action:** Update `src/db/schema.sql` to use **Short Names** (e.g., 'SBI', 'HDFC') as Primary Keys, matching the logic in `fix-amc-duplicates.js`.
- **Outcome:** Ensures consistent data seeding regardless of how the DB is initialized.

### Fix 2: Improve Full Sync Robustness
- **Action:** Add detailed logging to `runFullSync` to confirm exactly how many NAV records are upserted.
- **Action:** Ensure `runFullSync` correctly parses the `DD-MM-YYYY` date format from MFAPI (Confirmed handled by `fundNavHistoryModel`).
- **Action:** Verify `scheduler.job.js` actually triggers `runIncrementalSync` after `runFullSync`.
    - Current Code: `cronRegistry.register('Full Fund Sync', ...)` does trigger incremental sync afterwards.
    - **Optimization:** If `Full Sync` detects "stale" headers or low update count, it should explicitly force incremental sync.

### Fix 3: UI Data Source Verification
- **Action:** Verify `localFundService` joins are efficient and correct (Confirmed correct).
- **Optimization:** Ensure `AmcList.jsx` handles potentially mismatched `fund_house` names (e.g. Master says 'SBI', Funds say 'SBI Mutual Fund') for scheme counting.
