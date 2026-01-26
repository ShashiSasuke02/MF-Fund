# Plan: Admin Dashboard Optimization & Database Logs

## 1. Overview
Streamline the **Admin Dashboard** and focus on Database Activity monitoring.

**Goals:**
1.  **Simplify Overview:** Remove clutter ("Quick Actions", financial totals).
2.  **Enhance Monitoring:** Focus exclusively on **Database Activity Logs**.

## 2. Proposed Changes

### A. Cleanup (`client/src/pages/AdminDashboard.jsx`)
*   **Remove Component:** `<QuickActions />`
*   **Remove Stats Cards:** "Total Invested" and "Current Value".
*   **Layout:** Resize remaining 4 cards (Users, Funds, NAVs, Transactions) to a 4-column grid.

### B. Backend Optimization (`src/controllers/admin.controller.js`)
*   **Query Optimization:** Remove the expensive SQL aggregation for `total_invested` and `total_current_value`.
*   **Performance Gain:** Dashboard load time will decrease significantly by skipping these full-table scans.

### C. Logs Tab Refinement
*   **Action:** Keep only the existing "Database Activity" view (Scheduler Logs, Sync Logs, etc.).
*   **Removal:** Do **NOT** implement the "Live Terminal" log streaming feature.
*   **UI Update:** Ensure the Logs tab is clean and focused solely on structured DB logs (`execution_logs`, `fund_sync_logs`, etc.).

## 3. UI Layout Plan
**Revised Overview Tab:**

| Row | Content |
| :--- | :--- |
| **Row 1** | **Stats Grid (4 Cards)**<br>1. Total Users<br>2. Total Funds<br>3. NAV Records<br>4. Total Transactions |
| **Row 2** | **Charts (Split View)**<br>1. Scheduler Stats (Left)<br>2. Sync Activity Chart (Right) |

**Revised Logs Tab:**
*   **Single View:** Database Activity Logs (Table View).
*   **Removed:** No toggle for "Live Terminal".

## 4. Verification
1.  **Visual Check:** Confirm "Quick Actions" and Financial Cards are gone.
2.  **Functional Check:** Verify Logs tab shows Database Activity correctly.
3.  **Performance Check:** Verify dashboard loads faster without heavy aggregations.
