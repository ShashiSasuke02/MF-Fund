# Implementation Plan: Timezone Fix for Double Execution Bug

## 1. Problem Statement
**Issue:** Users investing around midnight (IST) experience a "Double Execution" of SIPs.
**Scenario:**
1.  User starts SIP at 12:01 AM IST Jan 31st.
2.  System sees UTC time: 6:31 PM Jan 30th ("Yesterday").
3.  Logic: "Execute Immediate" (Success).
4.  Logic: "Set Next Date" -> Jan 30 + 1 Day = Jan 31st.
5.  Scheduler runs at 6:00 AM IST Jan 31st (which is Jan 31st).
6.  Scheduler sees "Due Date: Jan 31st" -> Executes again.

**Root Cause:**
1.  Frontend/Backend relies on `new Date().toISOString()` which returns UTC date.
2.  `demo.service.js` calculates next date based on UTC "Yesterday", causing `next_execution_date` to fall on "Today".
3.  Immediate execution does not properly set `last_execution_date`, making the scheduler think the transaction is "fresh".

---

## 2. Solution Specification

### 2.1 Core Principle: "IST Truth"
We will stop using `toISOString().split('T')[0]` (UTC Date) and implement a rigorous `getISTDate()` utility. All business logic will use this to determine "Today".

### 2.2 Change Impact Matrix (Tier 0.5)

| Layer | File | Risk | Reason |
| :--- | :--- | :--- | :--- |
| **Logic** | `src/utils/date.utils.js` | **LOW** | New utility file (Safe) |
| **Service** | `src/services/demo.service.js` | **HIGH** | Core Investment Logic |
| **Service** | `src/services/scheduler.service.js` | **HIGH** | Core Transaction Engine |
| **Model** | `src/models/transaction.model.js` | **MEDIUM** | Query logic update |

---

## 3. Implementation Steps

### Step 1: Create Date Utility
**New File:** `src/utils/date.utils.js`

```javascript
/**
 * Returns current date in IST (Asia/Kolkata) formatted as YYYY-MM-DD
 * Used to ensure "Today" is consistent regardless of Server UTC time.
 */
export const getISTDate = () => {
  return new Date().toLocaleDateString('en-CA', { // en-CA gives YYYY-MM-DD
    timeZone: 'Asia/Kolkata'
  });
};

/**
 * Returns a Date object set to IST timezone
 */
export const getISTTime = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};
```

### Step 2: Fix Immediate Execution Logic (`src/services/demo.service.js`)

**Current Logic (Buggy):**
```javascript
// Uses UTC implicitly
const today = new Date(); // Jan 30 18:31 UTC
nextExecutionDate = calculateNextDate(today, frequency); // Jan 31
```

**New Logic (Fixed):**
```javascript
import { getISTDate } from '../utils/date.utils.js';

// Use IST Today
const todayIST = getISTDate(); // "2026-01-31"

// Explicitly set state to prevent re-execution
await transactionModel.create({
    // ...
    status: 'SUCCESS',
    nextExecutionDate: calculateNextDate(todayIST, frequency), // 2026-02-01 (Safe!)
    lastExecutionDate: todayIST, // CRITICAL FIX: Mark as done today
    executionCount: 1            // CRITICAL FIX: Start count at 1
});
```

### Step 3: Fix Scheduler Loop (`src/services/scheduler.service.js`)

**Logic:**
Instead of `new Date().toISOString().split('T')[0]`, use `getISTDate()`.

```javascript
import { getISTDate } from '../utils/date.utils.js';

async executeDueTransactions(targetDate = null) {
    if (!targetDate) {
        targetDate = getISTDate(); // Forces IST "Today"
    }
    // ... rest of logic
}
```

---

## 4. Verification Plan

### 4.1 Automated Test Case (Simulation)
We will create a script `scripts/test-timezone-fix.js` that:
1.  Mocks the system time to `2026-01-31 00:05:00 IST`.
2.  Creates a Daily SIP.
3.  Checks `next_execution_date` in DB.
    *   **Fail:** If value is `2026-01-31`.
    *   **Pass:** If value is `2026-02-01`.

### 4.2 Manual Verification
1.  Place a SIP.
2.  Check the "My Portfolio" -> "Transactions" tab.
3.  Verify the "Next Date" column shows Tomorrow's date, not Today's.

## 5. Rollback Strategy
If the new date utility causes offset issues:
1.  Revert `demo.service.js` to use `new Date()`.
2.  Delete `src/utils/date.utils.js`.
