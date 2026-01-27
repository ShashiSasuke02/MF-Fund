# Plan: SIP Lifecycle & Recurring Status Optimization

## 1. Goal
Ensure **SIP (Systematic Investment Plans)** continue executing after the first installment by correctly handling the `RECURRING` status, AND implement a Global Notification System to alert users of these background successes.

## 2. Problem Statement
1.  **Status Logic Bug:** `scheduler.service.js` updates SIPs to `RECURRING`, but `transaction.model.js` only fetches `PENDING`. Result: SIPs die after 1st run.
2.  **Missing Feedback:** Users don't know when their background SIPs execute. They need "Wealth Builder Alerts".

## 3. Proposed Solution

### A. Fix Status Logic (Core)
*   Update `transactionModel.findDueTransactions` to fetch `PENDING` OR `RECURRING`.
*   Update `schedulerService` to handle `RECURRING` SIPs correctly.

### C. Future SIP Zero-Allocation (New Requirement)
*   **Problem:** Future-dated SIPs show estimated Units/NAV immediately (e.g., based on today's NAV), which is misleading.
*   **Goal:** For future start dates, set `units = 0` (or null) and `nav = 0` (or null) at creation.
*   **Execution:** The Scheduler will populate these values during the **first execution**.

## 4. Implementation Details

#### [MODIFY] `src/services/demo.service.js`
*   **Function:** `createTransaction`
*   **Logic:**
    ```javascript
    if (new Date(startDate) > today) {
        units = 0;
        nav = 0;
        status = 'PENDING';
    } else {
        // Calculate as usual
    }
    ```

#### [MODIFY] `client/src/components/TransactionList.jsx` (or Portfolio)
*   **Display Logic:** If `units === 0` && `status === 'PENDING'`, display `"-"` or `"TBD"` instead of `0`.

#### [MODIFY] `src/models/transaction.model.js`
*   **Function:** `findDueTransactions`
*   **Change:**
    ```javascript
    // SQL Query Update
    `SELECT * FROM transactions 
     WHERE status IN ('PENDING', 'RECURRING') ...`
    ```

#### [NEW] `src/controllers/notification.controller.js`
*   `getNotifications(req, res)`: Fetch unread notifications for user.
*   `markAsRead(req, res)`: Update `is_read = true`.

#### [NEW] `src/routes/notification.routes.js`
*   Define routes and mount to `/api/notifications`.

#### [MODIFY] `src/services/scheduler.service.js`
*   **Logic:** On success, verify `notificationModel.create` is called with "Wealth Builder Alert" title.
*   **Message Template:** "✅ Wealth Builder Alert! Your SIP for [Scheme] of ₹[Amount] was successful."

#### [MODIFY] `client/src/components/Navbar.jsx`
*   Add Notification Bell icon with unread count badge.
*   Dropdown to show recent alerts.

## 5. Verification Plan
1.  **Manual Test (SIP Cycle)**:
    *   Create SIP (Status: PENDING).
    *   Run Scheduler -> Verifies execution -> Checks Status is RECURRING.
    *   Advance Date + Run Scheduler -> Verifies 2nd execution (Fix confirmed).
2.  **Manual Test (Unit Addition)**:
    *   **Pre-Condition:** Note existing units for a scheme (e.g., 100 units).
    *   **Action:** Trigger SIP execution (e.g., 50 units).
    *   **Verification:** Check total units = 150. (Confirmed logic in `holdingModel.addUnits`: `newUnits = parseFloat(holding.total_units) + parseFloat(units)`).
3.  **Manual Test (SWP Unit Deduction)**:
    *   **Pre-Condition:** Note existing units (e.g., 100 units).
    *   **Action:** Trigger SWP execution (e.g., redeem 10 units).
    *   **Verification:** Check total units = 90. (Confirmed logic in `holdingModel.removeUnits`: `newUnits = parseFloat(holding.total_units) - parseFloat(units)`).
4.  **Manual Test (Notifications)**:
    *   Check database `user_notifications` table for new record.
    *   Verify API `GET /api/notifications` returns the alert.
5.  **Automated Check**:
    *   Run `checklist.py`.
