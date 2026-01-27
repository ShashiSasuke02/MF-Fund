# PLAN: SIP Lifecycle Management (RECURRING Status)

## 1. Objective
Refine the SIP transaction lifecycle so that active plans are marked as `RECURRING` while installments remain, and only transition to `SUCCESS` once all scheduled payments are completed.

## 2. Analysis & Root Causes
- **Early Success:** `demoService.executeTransaction` marks a SIP as `SUCCESS` on its first immediate execution.
- **Scheduler Stall:** `transactionModel.findDueTransactions` only queries for `PENDING` transactions, ignoring those in the `RECURRING` state.
- **Incomplete Logic in Scheduler:** The scheduler already has a partial `RECURRING` status transition for SIPs but lacks the conditional logic to switch to `SUCCESS` after the final installment.

## 3. Implementation Details

### A. Model Updates (`transaction.model.js`)
1.  **`findDueTransactions`**: Update the `WHERE` clause to include `RECURRING` status.
    - *Before:* `WHERE status = 'PENDING'`
    - *After:* `WHERE status IN ('PENDING', 'RECURRING')`
2.  **`findActiveSystematicPlans`**: Update to fetch plans with `RECURRING` status (and keep `SUCCESS` for legacy data/finished plans, though `RECURRING` is primarily what's "active").

### B. Scheduler Service Updates (`scheduler.service.js`)
1.  **`executeScheduledTransaction`**:
    - After a successful execution, calculate if additional installments are remaining.
    - **Status Logic:**
        - If `installments` completed OR `nextExecutionDate > endDate` -> Set status to `SUCCESS`.
        - Else if `type` in (`SIP`, `SWP`, `STP`) -> Set status to `RECURRING`.
    - Update `nextExecutionDate` to `null` if the status is `SUCCESS`.
2.  **`checkStopConditions`**: (Optional) Change "CANCELLED" to "SUCCESS" for transactions that reached their natural end (installments/date) if they were previously `RECURRING`.

### C. Demo Service Updates (`demo.service.js`)
1.  **`executeTransaction`**:
    - When creating a SIP/STP that starts today, set its initial status to `RECURRING` (since it's an active plan).
    - Ensure `nextExecutionDate` is calculated and saved during creation so the scheduler picks it up for the second installment.

## 4. Verification Plan
- [ ] **Test Case 1:** Create a SIP starting today with 2 installments.
    - Verify initial status is `RECURRING`.
    - Verify `execution_count` is 1.
- [ ] **Test Case 2:** Run scheduler for the next month.
    - Verify SIP executes.
    - Verify status changes to `SUCCESS`.
    - Verify `execution_count` is 2.
    - Verify `next_execution_date` is `null`.
- [ ] **Test Case 3:** Create a SIP starting in future.
    - Verify status is `PENDING`.
    - Run scheduler on start date -> Verify status changes to `RECURRING`.
