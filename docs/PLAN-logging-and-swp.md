# Implementation Plan - Logging Upgrade & SWP Fix

This plan addresses two critical improvements: enabling "Weekly" frequency for SWP (Systematic Withdrawal Plans) and upgrading the application logging to ensure observability of internal background jobs (Scheduler/Sync).

# Goal Description
1.  **SWP Frequency Relaxations:** Modify business logic to allow `WEEKLY` SWP transactions (currently blocked, restricted to MONTHLY/QUARTERLY only).
2.  **Logging Upgrade:** Replace ephemeral `console.log()` calls in `scheduler.service.js`, `demo.service.js`, and `mfapiIngestion.service.js` with the persistent `logger` service.

## Timezone Compliance (Mandatory)
> [!IMPORTANT]
> **IST Enforcement:** All date-related operations, including logging timestamps and execution date calculations, **MUST** use the `src/utils/date.utils.js` library (`getISTDate`, `toISTDateString`).
> -   **Scheduler:** Ensure `targetDate` logging uses the IST date string.
> -   **SWP Logic:** Ensure `startDate` validations for the new Weekly frequency respect IST "Today".

## User Review Required
> [!IMPORTANT]
> **SWP Weekly Frequency**: This change only affects the *creation* validation. The Scheduler's `calculateNextExecutionDate` logic already supports 'WEEKLY', so no backend engine changes are needed there.

> [!NOTE]
> **Logging Volume**: Moving Scheduler logs to file transport might increase log file size slightly, but the current rotation policy (20MB, 7 days retention) is sufficient to handle this.

## Proposed Changes

### Backend Services (`src/services/`)

#### [MODIFY] [demo.service.js](file:///src/services/demo.service.js)
-   **Logic Change:** Update the validation condition for SWP frequency.
    ```javascript
    // Current
    if (frequency !== 'MONTHLY' && frequency !== 'QUARTERLY') ...
    // New
    if (frequency !== 'WEEKLY' && frequency !== 'MONTHLY' && frequency !== 'QUARTERLY') ...
    ```
-   **Logging:** Replace `log(...)` helper (which currently wraps `console.log`) with `logger.info(...)` and `logger.error(...)`.

#### [MODIFY] [scheduler.service.js](file:///src/services/scheduler.service.js)
-   **Logging:** Replace all `console.log` and `console.error` calls with `logger.info` and `logger.error`.
    -   *Why:* To ensure "Double Execution" verification and other scheduler audits can be performed via the Admin Dashboard.

#### [MODIFY] [mfapiIngestion.service.js](file:///src/services/mfapiIngestion.service.js)
-   **Logging:** Replace `console.log` with `logger.info`. This is critical for debugging "Full Sync" failures or timeouts.

## Verification Plan

### Automated Verification
1.  **SWP Creation Test:**
    -   Create a script `scripts/test-swp-weekly.js` to attempt creating a WEEKLY SWP.
    -   **Expectation:** Transaction status `SUCCESS` (or `PENDING`), not "Error: SWP frequency must be...".

2.  **Log File Verification:**
    -   Run the Scheduler manually (or via script).
    -   Check `logs/application-YYYY-MM-DD.log`.
    -   **Expectation:** See `[Scheduler] Starting execution...` entries in the *file*, not just standard output.

### Manual Verification
-   **Admin Dashboard:**
    -   Go to Admin -> System Logs.
    -   Download the latest log.
    -   Search for "Scheduler" to confirm visibility.
