# Plan: Full Fund Sync Email Notifications (2:30 AM Job)

## 1. Overview
The goal is to enable automated daily email reports sent immediately after the 2:30 AM "Full Fund Sync" job completes. This ensures visibility into the nightly data ingestion process (Active Funds, NAV Updates, Inactive Markings).

**Scope:**
- **Include:** "Full Fund Sync" (2:30 AM)
- **Feature Flag:** `ENABLE_FULL_SYNC_REPORT`

## 2. Architecture Analysis & Required Changes

### A. Cron Notification Service (`src/services/cronNotification.service.js`)
*   **Current State:** explicitly triggers only for `'Daily Transaction Scheduler'`.
*   **Required Change:**
    *   Add condition to check for `jobName === 'Full Fund Sync'`.
    *   Check for `process.env.ENABLE_FULL_SYNC_REPORT === 'true'`.
    *   Trigger `sendDailyReport` with a flag (e.g., `syncReport: true` or just reuse the filter logic).

### B. Email Service (`src/services/email.service.js`)
*   **Current State:** Professional template optimized for *Transactions* (Invested/Withdrawn).
*   **Required Change:**
    *   Add logic to parse "Full Fund Sync" results.
    *   **New Summary Cards for Sync:**
        *   **Green:** "NAVs Updated" (Mapped from `result.navInserted`)
        *   **Blue:** "Funds Inserted" (Mapped from `result.inserted`)
        *   **Gray:** "Marked Inactive" (Mapped from `result.markedInactive`)
    *   **Table Details:** Show `Batch Progress`, `Errors`, and `Optimization` details in the job row.

### C. Environment Configuration (`.env`)
*   **New Variable:**
    ```ini
    ENABLE_FULL_SYNC_REPORT=true
    ```

## 3. Implementation Steps

### Step 1: Code Modification (`src/services/cronNotification.service.js`)
*   **Action:** Update `onJobComplete`.
*   **Logic:**
    ```javascript
    if (jobName === 'Full Fund Sync') {
        if (process.env.ENABLE_FULL_SYNC_REPORT !== 'true') return;
        
        await this.sendDailyReport({ 
            jobFilter: 'Full Fund Sync',
            reportType: 'SYNC' 
        });
    }
    ```
*   **Refactor:** Update `sendDailyReport` to accept a flexible `filter` or `type` instead of just `schedulerOnly`.

### Step 2: Code Modification (`src/services/email.service.js`)
*   **Action:** Enhance template to support "Sync Mode".
*   **Logic:**
    *   If `reportType === 'SYNC'`, render different Summary Cards.
    *   Data mapping:
        *   **Card 1:** `Total Funds Inserted` (`result.inserted`)
        *   **Card 2:** `NAV Records Updated` (`result.navInserted`)

### Step 3: Verification Script
*   **Script:** `scripts/test-sync-email.js`
*   **Mock Data:**
    ```json
    {
      "jobName": "Full Fund Sync",
      "status": "SUCCESS",
      "result": {
        "navInserted": 2450,
        "inserted": 2500,
        "markedInactive": 0
      }
    }
    ```

## 4. Verification Strategy
1.  **Mock Test:** Run script to verify the email layout adapts to show Sync stats instead of Financial stats.
2.  **Configuration Check:** Ensure it respects the `ENABLE_FULL_SYNC_REPORT` flag.
