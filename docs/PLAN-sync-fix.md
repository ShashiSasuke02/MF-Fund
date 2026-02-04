# Plan: Fix Sync Latency & AMC Duplicates

## Goal
Fix duplicate AMC entries in the AMC List caused by inconsistent seeding, and resolve NAV update latency by optimizing the sync workflow.

## User Review Required
> [!IMPORTANT]
> **Schema Change:** Modifying `schema.sql` to use short names (e.g., 'SBI' vs 'SBI Mutual Fund') means future fresh installs will match the current `fix-amc-duplicates.js` logic. Existing databases must run `fix-amc-duplicates.js` once to align.

## Proposed Changes

### Database Layer
#### [MODIFY] [schema.sql](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/db/schema.sql)
-   Update `INSERT IGNORE` statement for `amc_master` to use Short Names (e.g., 'SBI') instead of Long Names ('SBI Mutual Fund').
-   This prevents duplicates if the fix script is run on a fresh DB.

### Backend Services
#### [MODIFY] [mfapiIngestion.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/mfapiIngestion.service.js)
-   **Enhance Full Sync:** Add explicit logging for NAV upserts to track success rate.
-   **Date Parsing:** Explicitly validate `nav_date` from `/mf/latest` before upserting.
-   **Optimization:** Ensure `runFullSync` returns meaningful stats to the scheduler.

#### [MODIFY] [scheduler.job.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/jobs/scheduler.job.js)
-   **Robustness:** Add a safety check. If `runFullSync` result indicates potential staleness (e.g., 0 NAVs updated), force `runIncrementalSync` with a `force: true` flag (if applicable) or log a warning. (Current logic already chains them, which is good).

#### [MODIFY] [cronNotification.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/cronNotification.service.js)
-   **Fix Stats Parsing:** Update `sendDailyReport` to correctly extract stats from the nested `fullSync` object returned by the job.
-   Current: `stats.fundsFetched = result.totalFetched` (Undefined -> 0)
-   Fix: `stats.fundsFetched = (result.fullSync?.totalFetched || 0) + (result.incrementalSync?.totalFetched || 0)`

### Scripts
#### [VERIFY] [fix-amc-duplicates.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/scripts/fix-amc-duplicates.js)
-   No changes needed, but will be used for verification.

## Verification Plan

### Automated Tests
-   None (logic is integration-heavy).

### Manual Verification
1.  **Duplicate Check:**
    -   Run `node scripts/fix-amc-duplicates.js` to ensure clean state.
    -   Run `node src/server.js` (or docker).
    -   Check `AmcList` page. verified unique cards.
2.  **Sync Test:**
    -   Manually trigger "Full Fund Sync": `docker compose exec backend node -e "require('./src/jobs/scheduler.job.js').triggerJobManually('Full Fund Sync')"`
    -   Check logs: `docker compose logs backend --tail 100` -> Verify "Full Fund Sync completed" and "Incremental Fund Sync" starts.
    -   Check `AmcList` for duplicates (Should be none).
    -   Check `Portfolio` / `FundDetails` for today's NAV.
