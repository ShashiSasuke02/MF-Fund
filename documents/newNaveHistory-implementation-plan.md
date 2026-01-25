# IMPL-nav-history-sync: Bulk 30-Day NAV History Sync

## 1. Goal
Implement a manual, admin-triggered job to fetch and synchronize NAV history (last 30 days) for all **active whitelisted** mutual funds. This replaces the existing "Incremental Sync".

## 2. Technical Constraint & Reality Check
> **USER REQUIREMENT:** "Insertion should be as quick as full sync."
> **REALITY:**
> - **Full Sync:** Uses **1 single API call** (`/mf/latest`) to fetch data for 5000+ funds. Takes < 5 seconds.
> - **History Sync:** MFAPI **does not** have a bulk history endpoint. We must make **1 API call per fund**.
>   - 4,000 active funds = 4,000 HTTP requests.
>   - Even with batching (e.g., 20 parallel requests), this will take significantly longer (minutes, not seconds) and risks rate limiting.
> **STRATEGY:** We will optimize for *throughput* using a "Producer-Consumer" pattern with concurrency limits, but we must set user expectations that it will not be instant.

## 3. Renaming Strategy
- **Current:** `runIncrementalSync` (in `mfapiIngestion.service.js`)
- **New Name:** `runNavHistorySync`
- **UI Label:** Change "Incremental Sync" to "Fetch 30-Day History" in Admin Panel.

## 4. Implementation Details

### A. Service Layer (`mfapiIngestion.service.js`)
1.  **Rename Method:** `runIncrementalSync` -> `runNavHistorySync`.
2.  **Logic Change:**
    - Fetch all active `scheme_codes` **that belong to whitelisted AMCs**.
    - **Batch Processing:** Process in chunks of 50 (concurrently).
    - **API Call:** Call `mfApiService.getNAVHistory(code)` for each.
    - **Optimization:**
        - Filter response to keep only last 30 entries *in memory* before DB insert.
        - Use `fundNavHistoryModel.bulkUpsert` (needs creation) to insert 50 records at once instead of 1-by-1.
3.  **Rate Limiting:** Implement `p-limit` or strict batch delays to avoid 429 errors from MFAPI.

### B. Database Model (`fundNavHistory.model.js`) 
- **New Method:** `bulkUpsertNavRecords(records)`
- **Query:** Optimized `INSERT INTO ... VALUES ... ON DUPLICATE KEY UPDATE` for massive datasets.

### C. Admin Controller (`scheduler.controller.js` or `admin.controller.js`)
- **Action:** Map the "Trigger Sync" button to this new function.
- **Feedback:** Since it takes time, the API should return "Job Started" immediately (Async), and the frontend should poll for status or show a "In Progress" badge using `fund_sync_log`.

## 5. Execution Plan

### Step 1: Model Updates
- [ ] Add `bulkUpsertNavRecords` to `fundNavHistory.model.js`.

### Step 2: Service Refactor
- [ ] Rename `runIncrementalSync` to `runNavHistorySync`.
- [ ] Rewrite logic to fetch history instead of latest NAV.
- [ ] Implement batching (Size: 20-50) + Concurrency handling.
- [ ] Implement "Last 30 Days" filtering.

### Step 3: Controller & Route
- [ ] Update `manualTrigger` endpoint to call new method.
- [ ] Update frontend button label (if applicable in `SchedulerStats.jsx` or similar).

### Step 4: Verification
- [ ] Run job manually.
- [ ] Verify `fund_nav_history` table has 30 entries per fund.
- [ ] Monitor execution time vs API rate limits.
