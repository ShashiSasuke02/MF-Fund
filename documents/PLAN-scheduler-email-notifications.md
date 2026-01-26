# Plan: Scheduler Email Notifications (Transaction Scheduler Only)

## 1. Overview
The goal is to enable automated daily email reports sent immediately after the 6:00 AM "Daily Transaction Scheduler" job completes. This report will be **strictly limited** to the Transaction Scheduler execution and feature a **professional, high-quality design**.

**Scope:**
- **Include:** "Daily Transaction Scheduler" (6:00 AM)
- **Exclude:** "Full Fund Sync", "Incremental Fund Sync", and any other background jobs.

## 2. Existing Architecture Analysis

### A. Cron Notification Service (`src/services/cronNotification.service.js`)
- **Required Change:** Logic to filter out non-scheduler jobs and check the specific feature flag (`ENABLE_TRANSACTION_SCHEDULER_REPORT`).

### B. Email Service (`src/services/email.service.js`)
- **Required Change:** 
    - Parse financial statistics (Invested/Withdrawn).
    - **Design Upgrade:** Replace generic table with a **professional, modern HTML email template**.

### C. Scheduler Service (`src/services/scheduler.service.js`)
- **Required Change:** Enhance return object to include financial totals (`totalInvested`, `totalWithdrawn`).

## 3. Implementation Steps

### Step 1: Code Modification (`src/services/scheduler.service.js`)
*   **Action:** Update `executeDueTransactions` to calculate and return `totalInvested` (SIPs) and `totalWithdrawn` (SWPs).

### Step 2: Code Modification (`src/services/cronNotification.service.js`)
*   **Action:**
    1.  Update logic to ONLY include `'Daily Transaction Scheduler'`.
    2.  Check `process.env.ENABLE_TRANSACTION_SCHEDULER_REPORT === 'true'`.

### Step 3: Code Modification (`src/services/email.service.js`)
**Goal:** Create a Professional, Neat, and Clean Email Template.
*   **Design Specs:**
    *   **Header:** Clean branding "Daily Transaction Report" with date.
    *   **Summary Cards:**
        *   Green Card: "Total Invested" (e.g., ₹25,000)
        *   Blue Card: "Total Scanned" (Transactions)
        *   Red/Gray Card: "Failed/Skipped"
    *   **Table:** Minimalist, striped rows, distinct status badges (Success = Green Pill, Failed = Red Pill).
    *   **Footer:** Confidentiality notice and subtle branding.
    *   **Responsive:** Works well on mobile and desktop.

### Step 4: Environment Configuration (`.env`)
```ini
# Enable Reports
ENABLE_CRON_REPORTS=true            
ENABLE_TRANSACTION_SCHEDULER_REPORT=true        # SPECIFIC switch
CRON_REPORT_EMAIL=your_email@example.com

# SMTP Settings
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=TryMutualFunds <noreply@trymutualfunds.com>
```

### Step 5: Verification Script
Create `scripts/test-email-notification.js` to simulate the reporting flow with mock data to visualize the new design.

## 4. Verification Strategy
1.  **Visual Check:** Trigger email via script and verify the HTML layout looks professional in an actual email client (or HTML preview).
2.  **Logic Check:** Verify financial totals match the mock data.
