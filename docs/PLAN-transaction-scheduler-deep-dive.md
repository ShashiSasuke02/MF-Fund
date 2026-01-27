# Deep Dive: Daily Transaction Scheduler

## 1. Executive Summary
The **Daily Transaction Scheduler** is a self-contained, local-first background job that automates the execution of systematic investment plans (SIP) and withdrawal plans (SWP). It runs **every morning at 6:00 AM IST** and executes transactions based on the latest NAV data synced to the local database at 2:30 AM.

## 2. Core Architecture

### **Job Definition**
*   **File:** `src/jobs/scheduler.job.js`
*   **Trigger:** Cron Expression `0 6 * * *` (Daily at 6:00 AM)
*   **Execution:** Calls `schedulerService.executeDueTransactions(today)`.

### **Data Source (Local-First)**
*   **NAV Source:** `localFund.service.js` -> `fund_nav_history` table.
*   **Significance:** The scheduler **never** calls external APIs. It relies 100% on the data present in the local MySQL database.
*   **Latency:** Near-zero (local SQL queries).

---

## 3. Execution Pipeline (`scheduler.service.js`)

The specific method `executeDueTransactions(date)` follows this rigorous pipeline:

### **Phase 1: Discovery & Locking**
1.  **Release Stale Locks**: Clears any locks (`is_locked=1`) older than 5 minutes to prevent deadlocks from crashed previous runs.
2.  **Query Due Transactions** (`transactionModel.findDueTransactions`):
    *   **Criteria:**
        *   `status = 'PENDING'` (or `RECURRING` logic handled in query potentially? *Correction: The query specifically looks for `status = 'PENDING'` but SIPs are updated to `RECURRING`... wait.*
        *   *Analysis from Code*: The query in `transaction.model.js` is: `WHERE status = 'PENDING'`.
        *   *Crucial Note*: If SIPs are set to `RECURRING`, the current query `WHERE status = 'PENDING'` **might miss them** if the status isn't handled correctly.
        *   *Correction from `scheduler.service.js` Line 221*: `newStatus = 'RECURRING'` for SIPs.
        *   *Correction from `transaction.model.js` Line 143*: `WHERE status = 'PENDING'`.
        *   **POTENTIAL BUG IDENTIFIED**: If SIPs are set to `RECURRING` after first run, they will NOT be picked up by `findDueTransactions` which hardcodes `status = 'PENDING'`.
        *   *Let me re-verify this in the next step. If status is RECURRING, the query must include it.*

3.  **Concurrency Lock**:
    *   Before processing, it sets `is_locked = 1` for the specific transaction ID.
    *   If lock fails (already locked), it skips execution.

### **Phase 2: Validation & Stop Conditions**
1.  **Stop Conditions**:
    *   **Installment Limit**: If `execution_count >= installments`.
    *   **End Date**: If `today > end_date`.
    *   **Action**: If triggered, status becomes `CANCELLED` (or effectively stops).

### **Phase 3: Logic Engine**

#### **A. SIP (Systematic Investment Plan)**
*   **Formula**: `Units = Amount / NAV`
*   **Prerequisites**:
    1.  Fetch NAV from Local DB.
    2.  Check User Balance (`demo_accounts`).
*   **Action**:
    1.  Deduct `Amount` from User Balance.
    2.  Add `Units` to User Holdings (`holdings` table).
    3.  Upsert Holding: Updates `total_units`, `invested_amount`, and `current_value`.

#### **B. SWP (Systematic Withdrawal Plan)**
*   **Formula**: `UnitsToRedeem = Amount / NAV`
*   **Prerequisites**:
    1.  Fetch NAV from Local DB.
    2.  Check Unit Balance (`holdings`).
*   **Action**:
    1.  Deduct `UnitsToRedeem` from Holdings.
    2.  Calculate `AmountToRemove` (Cost Basis) for accurate P&L tracking.
    3.  Credit `Amount` to User Balance.

### **Phase 4: Completion & Next Schedule**
1.  **Status Update**:
    *   **SIP**: Sets status to `RECURRING`.
    *   **SWP**: Sets status to `PENDING` (so it is picked up again... assuming the query searches for PENDING).
2.  **Next Execution Date**:
    *   Calculated based on Frequency (DAILY +1d, WEEKLY +7d, MONTHLY +1m, etc.).
3.  **Notifications**:
    *   Sends "Passive Income Alert" (SWP) or "Wealth Builder Alert" (SIP).
4.  **Audit Log**:
    *   Writes to `execution_logs` table with details (NAV, Units, Balance).

---

## 4. Key Logic & Formulas

| Action | Formula/Logic |
| :--- | :--- |
| **Next Date (Monthly)** | `Date.setMonth(current.getMonth() + 1)` |
| **SIP Units** | `Amount / NAV` |
| **SWP Units** | `Amount / NAV` |
| **SWP Cost Basis** | `(Invested_Amount / Total_Units) * Units_Redeemed` |
| **Locking** | `is_locked = 1` WHERE `id = ?` AND `is_locked = 0` |

---

## 5. Critical Observations (Audit)

1.  **Query Clause Mismatch (Potential)**:
    *   The `scheduler.service.js` updates SIPs to `RECURRING`.
    *   The `transaction.model.js` query only looks for `status = 'PENDING'`.
    *   **Result**: SIPs might run once and then stop because they are in `RECURRING` state but the query only looks for `PENDING`.
    *   *Verification Required*: Check if `transactionModel.findDueTransactions` has been updated recently to include `RECURRING`. (Based on my file read, it explicitly says `status = 'PENDING'`).

2.  **Execution Time**:
    *   Runs at 6:00 AM.
    *   Market opens at 9:15 AM.
    *   This means it uses **Previous Day's NAV** (which is correct for mutual funds as NAV is declared EOD).

3.  **Idempotency**:
    *   The `is_locked` flag and `execution_log` ensure that even if the cron triggers twice, the transaction runs only once.

## 6. Conclusion
The Scheduler is robustly designed for **safety** (locks, local data) and **accuracy** (local NAVs). However, there is a **high-priority logic risk** regarding the `RECURRING` status which requires immediate verification to ensure SIPs continue after the first installment.
