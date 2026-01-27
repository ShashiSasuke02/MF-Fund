# PLAN: SIP Success Alert & Global Notification System

## 1. Objective
Implement a motivational notification system that alerts users when their scheduled SIP/SWP transactions are executed in the background. Specifically, adding "Wealth Builder" alerts for SIP successes.

## 2. Technical Architecture

### A. Backend: Trigger Logic
- **File:** `src/services/scheduler.service.js`
- **Logic:** Add a notification creation block inside `executeSIP` (similar to the existing SWP block).
- **Message Template:**
  - Title: `Wealth Builder Alert! 🚀`
  - Message: `High Five! Your monthly SIP of ₹${amount} for ${schemeName} was executed successfully. Your wealth is growing! 📈`
  - Type: `SUCCESS`

### B. Backend: API Endpoints
- **New Routes:** `src/routes/notification.routes.js`
- **Endpoints:**
  1. `GET /api/notifications`: Returns all unread notifications for the authenticated user.
  2. `PATCH /api/notifications/:id/read`: Marks a specific notification as read.
  3. `PATCH /api/notifications/read-all`: Marks all notifications as read.
- **Controller:** `src/controllers/notification.controller.js` to handle DB interaction via `notificationModel`.

### C. Frontend: User Interface
- **Component:** `client/src/components/NotificationToast.jsx`
  - A slide-in animation from the top-right.
  - Custom icons for `SUCCESS` (Rocket/Chart) and `ERROR` (Warning).
  - Branded colors (Emerald/Teal for success).
- **Global Context:** `client/src/contexts/NotificationContext.jsx`
  - Fetches unread notifications every time the user logs in or the profile is loaded.
  - Manages the queue of visible alerts.
- **Integration:** Wrap the `Layout` with `NotificationProvider`.

## 3. Implementation Steps

1. **Step 1: Backend API**
   - Implement `notification.controller.js` and `notification.routes.js`.
   - Register the routes in `app.js`.
2. **Step 2: Scheduler Hook**
   - Add the `notificationModel.create` call to `schedulerService.executeSIP`.
3. **Step 3: Frontend Component**
   - Build the `NotificationToast` component with Tailwind animations.
4. **Step 4: Real-time Fetching**
   - Integrate notification fetching into the user's dashboard entry point.

## 4. Verification Plan
- [ ] **Manual Test:** Manually insert a record into `user_notifications` and refresh the page. Verify the alert pops up.
- [ ] **End-to-End Trace:** 
  1. Create a SIP starting tomorrow.
  2. Manually trigger the scheduler for "tomorrow".
  3. Log in as the user and verify the "Wealth Builder Alert" appears.
