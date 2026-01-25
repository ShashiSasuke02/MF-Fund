
# PLAN-swp-notification: Motivational SWP Execution Alerts

## 1. Goal
Notify users when an SWP (Systematic Withdrawal Plan) executes, ensuring they feel "motivated and enthusiastic" about their returns. 
- **Requirement:** Show a popup message on success or failure.
- **Offline Handling:** If user is offline, show it upon their next login.

## 2. Notification Strategy

### A. Message Tone (Enthusiastic & Clear)
- **Success:** 
  > "🎉 High Five! Your SWP just executed successfully! ₹5,000 has been credited to your balance. Your portfolio is working for you!"
- **Failure:** 
  > "⚠️ Action Needed! Your SWP couldn't go through today because of [Reason]. Let's fix this so you stay on track!"

### B. Technical Architecture (Store & Forward)
Since SWPs run in the background (scheduler), the user might not be online. We need a "Notification Queue".
*Constraint:* Must coexist with any existing login popups (do not overwrite existing `useEffect` logic).

1.  **Backend (Notification Queue):**
    - Create a new table `user_notifications`.
    - When Scheduler executes SWP -> Insert record into `user_notifications` (is_read = false).
2.  **Frontend (Polling/Check on Load):**
    - Component `<NotificationManager />` mounted in `App.jsx`.
    - Checks for unread notifications on mount and periodically.
    - Displays using the existing Popup/Modal component.

## 3. Implementation Details

### Step 1: Database Schema (`user_notifications`)
New table to store pending alerts.
```sql
CREATE TABLE user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('SUCCESS', 'ERROR', 'INFO') DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Backend Logic
1.  **Model:** `src/models/notification.model.js` (create, getUnread, markRead).
2.  **Service Update:** 
    - Modify `src/services/scheduler.service.js`.
    - Inside `executeScheduledTransaction`:
        - On Success: Create notification "🎉 Passive Income Alert! [Amount] credited..."
        - On Failure: Create notification "⚠️ SWP Missed..."
3.  **API Endpoint:** 
    - `GET /api/notifications/unread` (Fetch pending alerts).
    - `POST /api/notifications/:id/read` (Mark as read).

### Step 3: Frontend Logic
1.  **Component:** `client/src/components/NotificationManager.jsx`.
    - Uses `useEffect` to call `/api/notifications/unread`.
    - If data exists, triggers the Global Popup (e.g., SweetAlert or custom Modal).
    - On close, calls mark-read API.
2.  **Integration:** Add to `App.jsx` layout so it works on any page.



### Step 5: SWP Logic Enhancements (Constraints)
**New Validation Rules:**
1.  **Start Date:** Must be a future date (specifically "next month" or later). Immediate execution is DISABLED for SWP.
2.  **Frequency:** Restrict to `MONTHLY` or `QUARTERLY`.
    - **UI:** Show only `MONTHLY` and `QUARTERLY` options for SWP (Hide Daily/Weekly).

## 4. Proposed User Experience
1.  **Scenario:** User logs in at 9:00 AM.
2.  **System:** SWP ran at 6:00 AM.
3.  **UI:** 
    - Dashboard loads.
    - A beautiful, confetti-style popup appears: 
    - **"Good Morning! Your money hit your account. ₹10,000 SWP from SBI Bluechip executed."**
    - Button: "Awesome!"

## 5. Execution Steps
- [ ] Create `user_notifications` table.
- [ ] Implement `notification.model.js`.
- [ ] Update `scheduler.service.js` to insert notifications.
- [ ] Update `demo.service.js` to enforce Future Start Date and restrict to Monthly/Quarterly.
- [ ] Create API routes for notifications.
- [ ] Build Frontend Component to consume and display.

### Step 6: UI Refinements
- **Invest Page (`Invest.jsx`):**
    - **Remove Info Card:** Delete the "Important Information" section at the bottom of the form.
    - **Load Button Logic:** If User clicks "Load" and Scheme Code is empty -> Navigate to `/browse` (AMC List) instead of showing error.
    - When `transactionType` is `SWP`:
        - Change label from "Investment Amount" to **"Withdrawal Amount"**.
        - Change placeholder to **"Enter withdrawal amount"**.
    - For all other types, keep "Investment Amount".

### Step 7: Edge Case Handling
1.  **Insufficient Units (The "Sad" Path):**
    -   *Scenario:* User has insufficient units to cover the withdrawal amount.
    -   *Current Behavior:* Transaction fails silently or with generic error.
    -   *Solution:* Generate a specific "Action Needed" notification.
    -   *Message:* "⚠️ Low Balance! Your SWP of ₹[Amount] paused. Please top up your [Fund Name] holdings to resume."

2.  **NAV Unavailability:**
    -   *Scenario:* Scheduler runs on Sunday/Holiday.
    -   *Solution:* System uses the *latest available NAV* from local DB (e.g., Friday's close).
    -   *Action:* No code change needed (existing `localFundService` handles this), but we will add a check to ensure NAV is not older than 7 days.
