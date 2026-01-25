
# SWP Function Analysis (Systematic Withdrawal Plan)

## 1. Overview
The SWP function allows users to withdraw a fixed amount periodically from a specific mutual fund holding. 
- **Type:** Fixed Amount Withdrawal (Redeems units equivalent to that amount).
- **Frequency:** Supported: DAILY, WEEKLY, MONTHLY, QUARTERLY.

## 2. Implementation Logic

### A. Creation Phase (`demo.service.js`)
When a user sets up an SWP, the `executeTransaction` function handles the initial validation and creation:
1.  **Validation:**
    - Checks if the user actually holds the scheme.
    - Checks if `amount > 0`.
    - Checks if `holding.total_units > required_units` (based on *current* NAV).
2.  **Status Determination:**
    - If `startDate` > Today -> Status: `PENDING`.
    - If `startDate` <= Today -> Status: `SUCCESS` (Executes immediately).
3.  **Storage:**
    - Creates a record in `transactions` table with type `SWP`, `amount`, `frequency`, `startDate`, `endDate`, and `installments`.
    - `units` is stored as a **negative number** (e.g., `-10.5`) to indicate outflow if executed immediately.

### B. Execution Phase (`scheduler.service.js` & `demo.service.js`)
Recurring execution is handled by the Scheduler:

1.  **Trigger:** Daily cron job or manual trigger calls `schedulerService.executeDueTransactions()`.
2.  **Fetching Due SWPs:** Finds `PENDING` transactions where `next_execution_date <= Today`.
3.  **Calculation Logic:**
    - `Current NAV` = Fetched from local DB (latest available).
    - `Units to Redeem` = `Withdrawal Amount / Current NAV`.
4.  **Balance & Holding Update:**
    - **Step 1 (Check):** Verifies if `holding.units >= Units to Redeem`.
    - **Step 2 (Redeem):** Decreases `holding.units`.
    - **Step 3 (Credit):** Increases `user.balance` (Demo Balance) by the Withdrawal Amount.
    - **Step 4 (Log):** Records successful execution in `execution_logs`.
5.  **Scheduling Next Run:**
    - Updates `next_execution_date` based on frequency (e.g., +1 Month).
    - Increments `execution_count`.

## 3. Key Technical Details

- **Files:**
    - `src/services/demo.service.js`: Handles immediate execution (`executeSWP` inside `executeTransaction`).
    - `src/services/scheduler.service.js`: Handles recurring execution (`executeSWP` method).
- **Concurrency:** Uses database-level locking (`is_locked`) to prevent double withdrawals during scheduler runs.
- **Failures:** If units are insufficient on the withdrawal day, the transaction is marked `FAILED` (with reason) but remains `PENDING` for retry next time (Standard behavior, though could be enhanced to Auto-Cancel).

## 4. Current Limitations
1.  **Fixed Amount Only:** Does not support "Capital Appreciation" withdrawal (withdraw only profit).
2.  **NAV Dependency:** Relies on local DB having up-to-date NAVs. If sync fails, SWP execution fails.
3.  **Retry Logic:** Fails permanently for that day if balance is low; doesn't partial-withdraw.
