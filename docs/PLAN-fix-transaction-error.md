# Plan: Fix Transaction Status Error

## 1. Context Analysis
- **Issue:** `Data truncated for column 'status'` error in logs.
- **Root Cause:** The code attempts to set `status = 'COMPLETED'` in `demo.service.js` (user cancellation) and `scheduler.service.js` (natural completion).
- **Constraint:** The `transactions` table schema defines `status` as `ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'RECURRING')`. `COMPLETED` is **not** a valid value.
- **Impact:** 
    - User cannot cancel SIPs (500 Error).
    - Scheduler will crash when any SIP completes its tenure.

## 2. Proposed Solution
Modify the code to use `CANCELLED` instead of `COMPLETED`, as it is a valid ENUM value and effectively stops the scheduler from picking up the transaction (since the scheduler only selects `PENDING` or `SUCCESS`).

### Changes
#### `src/services/demo.service.js`
- **Location:** `cancelTransaction` function.
- **Change:** Update status update call to use `CANCELLED`.

#### `src/services/scheduler.service.js`
- **Location:** `executeScheduledTransaction` function (Stop Condition block).
- **Change:** Update status update call to use `CANCELLED`.

## 3. Verification Plan
- **Manual Verification:**
    1.  Create a Dummy SIP.
    2.  Cancel it via API (Mock req).
    3.  Verify no 500 status in logs.
- **Automated Tests:**
    - Run existing `demo.service.test.js` if applicable.
    - Create a new unit test for `cancelTransaction` and `scheduler` stop condition (if accessible).

## 4. Rollback Strategy
- Revert changes to `COMPLETED` (though this returns to the broken state).
