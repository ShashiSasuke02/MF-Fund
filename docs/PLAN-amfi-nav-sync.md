# Plan: AMFI Text File NAV Sync

## 1. Executive Summary
**Goal:** Replace the current "Incremental Sync" (which likely uses API calls) with a highly efficient "Bulk Sync" using the official AMFI text file.

**Source:** `https://portal.amfiindia.com/spages/NAVAll.txt`
**Format:** Semicolon-delimited (`;`)
**Columns:** `Scheme Code`, `ISIN Div Payout/Growth`, `ISIN Div Reinvestment`, `Scheme Name`, `Net Asset Value`, `Date`

**Benefits:**
-   **Efficiency:** 1 HTTP request vs thousands.
-   **Speed:** Parsing ~15,000 lines of text is faster than network latency for multiple API calls.
-   **Reliability:** Direct source from AMFI.

## 2. Technical Implementation

### 2.1 File Parser Logic
-   **Parser:** Use Node.js `readline` module or simply split by `\n` to process the file stream.
-   **Delimiter:** `;`
-   **Date Parsing:** Convert `DD-MMM-YYYY` (e.g., `04-Feb-2026`) to `YYYY-MM-DD`.
-   **Filter:** Load all tracked `amfi_code`s from the `funds` table into a `Set`. Only process lines matching these codes.

### 2.2 Database Updates
-   **Batch Handling:** Collect valid updates in memory and perform bulk `INSERT` / `ON DUPLICATE KEY UPDATE`.
-   **Tables Affected:**
    -   `fund_nav_history`: Insert new NAV record.
    -   `funds`: Update `last_nav` and `last_date` columns.

### 2.3 Scheduler Integration
-   **New Job:** `AmfiNavSync`
-   **Schedule:** Runs nightly (e.g., 11:30 PM IST).
-   **Replacement:** Disable or remove the old `Incremental Sync` job.

## 3. Implementation Steps

### Phase 1: Service Creation
#### [NEW] [src/services/amfiSync.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/amfiSync.service.js)
-   `fetchNavFile()`: Downloads the text file.
-   `parseAndSync()`: Main logic to parse, filter, and update DB.
-   **Helper:** Date parser for `DD-MMM-YYYY`.

### Phase 2: Integration
#### [MODIFY] [src/scheduler/scheduler.job.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/scheduler/scheduler.job.js)
-   Import `amfiSyncService`.
-   Replace `Incremental Sync` logic with `amfiSyncService.parseAndSync()`.

### Phase 3: Cleanup
-   Remove old incremental sync logic if no longer needed (or keep as fallback).

## 4. Verification Plan

### Manual Verification
1.  **Trigger:** Create a manual script `scripts/trigger-amfi-sync.js` to run the service.
2.  **Observe:** Console logs showing "Downloaded X bytes", "Parsed Y lines", "Updated Z funds".
3.  **Verify DB:**
    ```sql
    SELECT * FROM funds WHERE last_synced_at > NOW() - INTERVAL 1 HOUR;
    ```
4.  **Compare:** Check if the NAV in DB matches the text file for a sample fund.

### Performance Test
-   Measure time taken for full sync. Target: < 10 seconds.
