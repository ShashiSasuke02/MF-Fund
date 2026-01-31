# Implementation Plan: Fix Sync Logic & Enable Incremental Sync

## 1. Problem Statement
**Issue:** The "Full Fund Sync" running at 1:00 AM IST frequently fails to update funds because of an overly strict date filter (`filterByCurrentMonth`).
**Root Cause:**
*   At 1:00 AM on the 1st of a new month, `filterByCurrentMonth` rejects all data from the previous day (31st) because the month doesn't match.
*   The "NAV Sync" button triggers "Incremental Sync" which *bypasses* this filter, confusing users why manual works but automatic fails.
*   "Incremental Fund Sync" job is currently commented out in the code.

---

## 2. Solution Specification

### 2.1 Logic Changes (Backend)
1.  **Relax Date Filter:** Update `filterByCurrentMonth` to `filterByRecentNav`.
    *   Logic: Accept NAV dates from the **Current Month** OR **Previous Month**.
    *   This ensures data from Jan 31st is accepted when the job runs on Feb 1st.
2.  **Enable Incremental Job:** Uncomment the registration in `scheduler.job.js`.
3.  **Schedule:** Keep Full Sync at **1:00 AM IST** as requested.

### 2.2 Change Impact Matrix (Tier 0.5)

| Layer | File | Risk | Reason |
| :--- | :--- | :--- | :--- |
| **Service** | `src/services/mfapiIngestion.service.js` | **MEDIUM** | Critical ingestion logic update. |
| **Job** | `src/jobs/scheduler.job.js` | **LOW** | Enabling existing code. |

---

## 3. Implementation Steps

### Step 1: Update Ingestion Service
**File:** `src/services/mfapiIngestion.service.js`

**Current Logic:**
```javascript
filterByCurrentMonth(funds) {
  // ...
  return navYear === currentYear && navMonth === currentMonth;
}
```

**New Logic:**
```javascript
filterByRecentNav(funds) {
    const now = new Date();
    // Calculate cutoff date (e.g., 45 days ago to be safe for manual runs too)
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - 45); 

    return funds.filter(fund => {
        if (!fund.date) return false;
        
        // Parse "DD-MM-YYYY"
        const [day, month, year] = fund.date.split('-').map(Number);
        
        // Create date object (Month is 0-indexed in JS)
        const navDate = new Date(year, month - 1, day);
        
        // Accept if NAV date is after cutoff
        return navDate >= cutoffDate;
    });
}
```
*Naming update in `runFullSync` method needed to match new function name.*

### Step 2: Enable Incremental Job
**File:** `src/jobs/scheduler.job.js`

**Action:** Uncomment the specific lines.
```javascript
// 3. Register Incremental Fund Sync (Run at 10 AM, 2 PM, 6 PM)
// Use IST Timezone implicitly via registry options or manually set
cronRegistry.register('Incremental Fund Sync', '0 10,14,18 * * *', async () => {
    return await mfapiIngestionService.runIncrementalSync();
});
```
*Note: Adjusted defaults to reasonable market hours (10, 14, 18).*

---

## 4. Verification Plan

### 4.1 Automated Logic Test
We can create a small script `scripts/test-date-filter.js` to verify the logic:
*   Mock Today = "2026-02-01"
*   Input Fund Date = "31-01-2026"
*   **Expect:** Pass (Currently Fails)

### 4.2 Manual Verification
1.  **Wait for 1 AM?** No, trigger "Full Sync" manually from Admin Dashboard actions (if supported) or CLI.
2.  **Check Logs:** Verify `skippedInactive` count drops significantly.
3.  **Check Incremental:** Verify "Incremental Fund Sync" appears in the Cron Jobs list on Admin Dashboard.
