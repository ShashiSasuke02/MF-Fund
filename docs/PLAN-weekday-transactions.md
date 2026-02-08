# Plan: Weekday-Only Transaction Processing

## Goal
Restrict all mutual fund transaction executions (Lump Sum, SIP, SWP) to market working days (Monday to Friday). Transactions initiated or due on Saturday/Sunday will be processed on the following Monday.

## User Review Required

> [!IMPORTANT]
> **Catch-up Execution**: On Monday morning, the scheduler will process all transactions that were due on Saturday and Sunday.
> 
> **Calculated Dates**: The "Next Installment" for deferred SIP/SWP transactions will be calculated from the **Execution Day** (Monday) rather than the original due date (Weekend). This shifts the future cycle slightly if a holiday or weekend is encountered.

## Proposed Changes

### [Backend] Utility
#### [NEW] [date.utils.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/utils/date.utils.js) (Enhancement)
- Add `isWeekday(date)` helper.
- Add `getNextWorkingDay(date)` helper.

---

### [Backend] Scheduler Logic
#### [MODIFY] [scheduler.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/scheduler.service.js)
- Update `executeDueTransactions` to check if today is a weekday.
- If it's a weekend, log a skip message and terminate.
- Ensure the query `WHERE next_execution_date <= ?` correctly picks up all past-due transactions from the weekend.

---

### [Backend] Transaction Creation
#### [MODIFY] [demo.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/demo.service.js)
- Update Lump Sum logic: If created on a weekend, set status to `PENDING` and `next_execution_date` to today (it will be picked up on Monday). Currently, Lump Sums execute immediately.
- Update SIP/SWP logic: If the `startDate` is a weekend, ensure it is treated as a future/pending transaction.

---

### [Backend] Future Date Calculation
- When a transaction is successfully executed on a Monday (but was due on Sat/Sun), the `next_execution_date` must be calculated from the **Actual Execution Date** (Today) to satisfy the frequency requirement.

---

### [Backend] Error Handling & Logging
- **Try-Catch Enforcement**: All transaction processing logic in `scheduler.service.js` and `demo.service.js` must be wrapped in `try-catch` blocks to prevent unexpected server crashes or blocked queues.
- **Comprehensive Logging**: 
    - Log as `info`: Weekend detection and decision to skip execution.
    - Log as `info`: Weekend transaction creation and decision to set as `PENDING`.
    - Log as `error`: Detailed error messages and stack traces inside all `try-catch` blocks.
    - Log as `debug`: Intermediate calculation steps for next execution dates.

## Verification Plan

### Automated Tests
- Create a test script `scripts/verify_weekday_logic.js` that mocks the current date as a Saturday and mocks the scheduler run to ensure it skips.
- Mock the date as a Monday and ensure it picks up records from the preceding Saturday/Sunday.

### Manual Verification
1.  **Lump Sum on Sunday**: Create a Lump Sum on a Sunday. Verify it stays `PENDING`.
2.  **Monday Execution**: Run the scheduler manually on Monday. Verify the Sunday transaction executes.
3.  **Cycle Check**: Verify that a monthly SIP starting on Sunday, Oct 1st (executed Oct 2nd) calculates its next date as Nov 2nd (1 month from execution).
