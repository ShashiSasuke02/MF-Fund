# Research: Notification System Architecture

**Date:** 2026-02-01
**Version:** 1.0
**Scope:** Analysis of End-to-End Notification Flow from Backend Scheduler to Frontend UI.

---

## 1. Executive Summary
The MF-Investments platform uses a **Database-Driven Polling Architecture** for notifications.
-   **Producers:** Backend services (Scheduler) create records in the `user_notifications` table.
-   **Consumers:** The React Frontend (`NotificationCenter`) polls the API every 60 seconds.
-   **Persistence:** Notifications are stored permanently until marked read, ensuring users never miss alerts even if they are offline when the event happens.

---

## 2. Notification Triggers (Producer Layer)

The primary source of notifications is the **Scheduler Service** executing automatic transactions.

**File:** `src/services/scheduler.service.js`

### A. Successful Transactions
When a generic `SIP` or `SWP` transaction executes successfully:

1.  **SIP Success:**
    *   **Trigger:** Daily Scheduler validates and executes a buy order.
    *   **Title:** `Wealth Builder Alert 🚀`
    *   **Message:** "✅ Wealth Builder Alert! Your SIP for [Scheme] of ₹[Amount] was successful. Next installment: [DD-MMM-YYYY]."
    *   **Type:** `SUCCESS` (Green)

2.  **SWP Success:**
    *   **Trigger:** Daily Scheduler validates units and credits user balance.
    *   **Title:** `Passive Income Alert! 🎉`
    *   **Message:** "High Five! Your SWP from [Scheme] executed successfully. ₹[Amount] has been credited to your balance. Next installment: [DD-MMM-YYYY]."
    *   **Type:** `SUCCESS` (Green)

### B. Failed Transactions
If an execution fails (e.g., insufficient balance/units):

1.  **Low Balance (SWP Paused):**
    *   **Trigger:** Error contains "Insufficient units" or "Insufficient balance".
    *   **Title:** `SWP Paused ⚠️`
    *   **Message:** "⚠️ Low Balance! Your SWP of ₹[Amount] paused. Please top up your [Scheme] holdings to resume."
    *   **Type:** `ERROR` (Red)

2.  **Generic System Failure:**
    *   **Trigger:** Database lock, network error, or other exceptions.
    *   **Title:** `Action Needed ⚠️`
    *   **Message:** "Your [Type] for [Scheme] couldn't execute today. Reason: [Error Message]"
    *   **Type:** `ERROR` (Red)

---

## 3. Data Storage (Persistence Layer)

**Table:** `user_notifications`
**Model:** `src/models/notification.model.js`

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INT (PK) | Unique Identifier |
| `user_id` | INT (FK) | Target User |
| `title` | VARCHAR | Short header (e.g., "Wealth Builder Alert") |
| `message` | TEXT | Detailed content |
| `type` | ENUM | `INFO`, `SUCCESS`, `WARNING`, `ERROR` |
| `is_read` | BOOLEAN | Default `FALSE` |
| `created_at` | TIMESTAMP | Creation time (UTC/Server Time) |

---

## 4. API Layer (Transport)

**Controller:** `src/controllers/notification.controller.js`
**Route:** `GET /api/notifications`

*   **Security:** Middleware ensures users can only access their own notifications (`req.user.id`).
*   **Response Format:**
    ```json
    {
      "success": true,
      "count": 2,
      "data": [
        { "id": 101, "title": "...", "message": "...", "type": "SUCCESS", "is_read": 0 }
      ]
    }
    ```

---

## 5. Frontend & UX (Presentation Layer)

**Component:** `client/src/components/NotificationCenter.jsx`

### Behavior
1.  **Auto-Polling:** The component runs `fetchNotifications()` every **60,000ms (1 minute)**.
2.  **Badge:** A red badge on the bell icon shows the count of `unread` items.
3.  **Dropdown:**
    *   Displays list of unread notifications.
    *   **Styling:** Uses Tailwind CSS for dynamic background colors based on `notification.type`.
        *   `SUCCESS` → `bg-emerald-50` with Green Checkmark.
        *   `ERROR` → `bg-red-50` with Red Exclamation.
4.  **Interaction:**
    *   **Mark Read:** Clicking the "X" or "Mark all read" sends a `PATCH` request to the API to set `is_read = TRUE`.
    *   **Optimistic UI:** The UI removes the item immediately before the API responds to ensure snappy feel.

---

## 6. Recommendations
1.  **Real-Time:** Currently relies on 1-minute polling. For instant alerts, we could implement `Socket.io`, but polling is sufficient for daily scheduler events.
2.  **Email Fallback:** High-priority alerts (like "SWP Paused due to Low Balance") should probably send an email in addition to the in-app notification.
