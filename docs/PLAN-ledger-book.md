# Implementation Plan - Ledger Book

## Goal Description
Implement a "Strict Ledger" system to track every virtual fund movement (credits and debits) with high fidelity. This ensures the user's "Available Balance" is strictly derived from a history of transactions, similar to a bank statement.

## User Review Required
> [!IMPORTANT]
> **Regression Safety:**
> - To ensure "no disturbance", I will **NOT** forcefully backfill ledger entries for old transactions. The ledger will start empty and track *new* movements from the moment of deployment.
> - **Question:** Do you strictly require a backfill script for historical data? (Defaulting to **NO** for safety).

## Proposed Changes

### Database Layer
#### [NEW] `src/db/migrations/create_ledger_entries.sql`
- Create `ledger_entries` table:
    - `id` (PK, Auto Inc)
    - `user_id` (FK to users)
    - `transaction_id` (Nullable FK to transactions - links to specific SIP/SWP execution)
    - `amount` (Decimal 15,2)
    - `balance_after` (Decimal 15,2 - Snapshot of balance)
    - `type` (Enum: 'CREDIT', 'DEBIT')
    - `description` (Text: e.g., "SIP Investment: SBI Bluechip", "Wallet Top-up")
    - `created_at` (Timestamp)

### Backend Layer
> [!NOTE]
> **Logging Strategy:** All new components must import `src/services/logger.service.js` and log:
> - Entry points (Controller/Service methods) with `logger.info`.
> - Critical actions (Record creation) with `logger.info`.
> - Errors with `logger.error` including stack traces.

#### [NEW] [ledger.model.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/models/ledger.model.js)
- Methods: `createEntry`, `getEntriesByUser`, `getBalanceSnapshot`.
- **Logging:** Log DB query failures.

#### [NEW] [ledger.controller.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/controllers/ledger.controller.js)
- Endpoint: `GET /api/ledger` (Paginated list for UI).
- **Logging:** Log request params (`userId`, `page`) and any validation errors.

#### [NEW] [ledger.routes.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/routes/ledger.routes.js)
- Register route: `/api/ledger`.

#### [MODIFY] [scheduler.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/scheduler.service.js)
- **Integration Point:** Inside `executeDueTransactions`.
- **Action:** After updating balance, call `LedgerModel.createEntry`.
- **Logging:** Log "Ledger entry created for Transaction ID: X" or "Failed to create ledger entry".

#### [MODIFY] [demo.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/demo.service.js)
- **Integration Point:** inside `resetAccount` and `investLumpSum`.
- **Action:** Log "Account Reset" or "Lumpsum Investment" to ledger.
- **Logging:** Log these events explicitly in the centralized logger.

### Frontend Layer
#### [NEW] [LedgerTable.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/components/portfolio/LedgerTable.jsx)
- Glassmorphism table component.
- Columns: Date, Description, Reference (Tx ID), Credit/Debit, Balance.
- Mobile-responsive card view.

#### [MODIFY] [Portfolio.jsx](file:///c:/Users/shashidhar/Desktop/MF-Investments/client/src/pages/Portfolio.jsx)
- Replace the "Investment Report" placeholder tab with `<LedgerTable />`.

## Verification Plan

### Automated Tests
- **Unit Extension**: Create `tests/unit/ledger.model.test.js`.
- **Integration Test**:
    1.  Reset Account (Check Ledger for "Reset" entry).
    2.  Place Lumpsum Order (Check Ledger for "Debit").
    3.  Trigger Scheduler (Check Ledger for "Debit" on SIP execution).

### Manual Verification
1.  **Visual Check**: Verify "Report" tab in Portfolio page loads the table.
2.  **Flow Check**: Perform a "Reset Balance" in Settings and verify the Ledger reflects the new opening balance.
