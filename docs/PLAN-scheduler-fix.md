# 🔧 PLAN-scheduler-fix: Scheduler Bugs & Notification Alerts

> **Created:** 2026-02-02  
> **Status:** 🔴 PENDING REVIEW  
> **Priority:** HIGH  
> **Affected Modules:** `scheduler.service.js`, `cronNotification.service.js`, `notification.model.js`

---

## Executive Summary

Analysis of the `Externalogs` logs from February 2nd, 2026 revealed **three critical issues** that require immediate attention:

| # | Issue | Severity | Root Cause |
|---|-------|----------|------------|
| 1 | `last_nav_date` Data Truncation | 🔴 HIGH | ISO timestamp (29 chars) stored in VARCHAR(10) |
| 2 | Missing SIP/SWP Notification Alerts | 🟡 MEDIUM | Notifications stored in DB but not logged/emailed |
| 3 | MFAPI NAV Fetch Failures | 🟢 LOW | External API issues for specific fund codes |

---

## 🚨 Issue 1: `last_nav_date` Data Truncation Error

### Error Log
```json
{
  "level": "error",
  "message": "[Scheduler] Transaction 3 failed: Data too long for column 'last_nav_date' at row 1",
  "timestamp": "2026-02-02T00:30:00.764Z"
}
```

### Root Cause Analysis

| Component | Location | Problem |
|-----------|----------|---------|
| **Schema** | `src/db/schema.sql:165` | `last_nav_date VARCHAR(10)` |
| **Bug #1** | `scheduler.service.js:449` | `new Date().toISOString()` (29 chars) |
| **Bug #2** | `scheduler.service.js:376` | `new Date().toISOString().split('T')[0]` (OK but inconsistent) |
| **Bug #3** | `scheduler.service.js:388` | `new Date().toISOString().split('T')[0]` (OK but inconsistent) |

**The Critical Bug (Line 449):**
```javascript
// In executeSWP() function
await holdingModel.updateCurrentValue(
  transaction.user_id,
  transaction.scheme_code,
  nav,
  new Date().toISOString()  // ❌ WRONG: "2026-02-02T00:30:00.764Z" (29 chars)
);
```

### Code Audit Results: All `last_nav_date` Usages

| File | Line | Code | Status |
|------|------|------|--------|
| `scheduler.service.js` | 376 | `new Date().toISOString().split('T')[0]` | ⚠️ OK |
| `scheduler.service.js` | 388 | `new Date().toISOString().split('T')[0]` | ⚠️ OK |
| `scheduler.service.js` | **449** | `new Date().toISOString()` | ❌ BUG |
| `demo.service.js` | 233, 244 | `formatDateForDB(fundDetails.latestNav?.date)` | ✅ OK |
| `demo.service.js` | 385 | `formatDateForDB(latestData.date)` | ✅ OK |
| `holding.model.js` | 16, 26, 125 | Pass-through (caller's responsibility) | ✅ OK |

### Proposed Fix

#### [MODIFY] scheduler.service.js (Line 449)

**Before:**
```javascript
// Line 449 in executeSWP()
await holdingModel.updateCurrentValue(
  transaction.user_id,
  transaction.scheme_code,
  nav,
  new Date().toISOString()
);
```

**After:**
```javascript
// Line 449 in executeSWP()
await holdingModel.updateCurrentValue(
  transaction.user_id,
  transaction.scheme_code,
  nav,
  getISTDate()  // Uses existing import from date.utils.js
);
```

#### Additional Consistency Fix (Lines 376, 388)

Replace `new Date().toISOString().split('T')[0]` with `getISTDate()` for consistency:

```javascript
// Line 376 in executeSIP()
await holdingModel.updateCurrentValue(
  transaction.user_id,
  transaction.scheme_code,
  nav,
  getISTDate()  // Was: new Date().toISOString().split('T')[0]
);

// Line 388 in executeSIP()
lastNavDate: getISTDate()  // Was: new Date().toISOString().split('T')[0]
```

---

## 🔔 Issue 2: Missing SIP/SWP Notification Alerts

### Symptom
User reported not seeing SIP/SWP execution alerts on the server this morning.

### Investigation Summary

#### 1. In-App Notifications (DB-based)
✅ **Working Correctly** - The scheduler **does** create in-app notifications:

```javascript
// scheduler.service.js:249-263
if (transaction.transaction_type === 'SWP') {
  await notificationModel.create({
    userId: transaction.user_id,
    title: 'Passive Income Alert! 🎉',
    message: `High Five! Your SWP from ${transaction.scheme_name} executed successfully...`,
    type: 'SUCCESS'
  });
} else if (transaction.transaction_type === 'SIP') {
  await notificationModel.create({
    userId: transaction.user_id,
    title: 'Wealth Builder Alert 🚀',
    message: `✅ Wealth Builder Alert! Your SIP for ${transaction.scheme_name}...`,
    type: 'SUCCESS'
  });
}
```

**These notifications are stored in the `user_notifications` table and displayed in the app UI.**

#### 2. Email Notifications (External)
⚠️ **Potential Gap** - The cron notification service sends daily summary emails but does NOT send individual SIP/SWP execution emails.

#### Current Notification Flow:

```
Transaction Scheduler 6AM
    │
    ├── Execute SIP/SWP
    │       │
    │       ├── Create DB Notification → user_notifications table → User views in App
    │       │
    │       └── Job Complete Event
    │               │
    │               └── cronNotificationService.onJobComplete
    │                       │
    │                       └── ENABLE_TRANSACTION_SCHEDULER_REPORT?
    │                               │
    │                               ├── Yes → Send Daily Summary Email
    │                               │
    │                               └── No → No Email Sent
```

#### 3. ENV Configuration Check

**docker-compose.yml:**
```yaml
ENABLE_CRON_REPORTS: ${ENABLE_CRON_REPORTS:-true}
CRON_REPORT_EMAIL: ${CRON_REPORT_EMAIL}  # ⚠️ May be empty!
ENABLE_TRANSACTION_SCHEDULER_REPORT: ${ENABLE_TRANSACTION_SCHEDULER_REPORT:-true}
```

**⚠️ Issue:** `CRON_REPORT_EMAIL` may not be set, which would cause emails to fail silently.

#### 4. Application Log Check
Looking for notification-related log entries around 6 AM IST on Feb 2nd:
- ❌ No `[CronNotification]` log entries found for the scheduler job
- ❌ The 6 AM scheduler job may have failed entirely due to the `last_nav_date` error

### Proposed Enhancements

#### A. Add Logging for Notification Creation

**[MODIFY] scheduler.service.js (Lines 249-263)**

```javascript
// After creating notification, add logging
if (transaction.transaction_type === 'SWP') {
  await notificationModel.create({
    userId: transaction.user_id,
    title: 'Passive Income Alert! 🎉',
    message: `High Five! Your SWP from ${transaction.scheme_name}...`,
    type: 'SUCCESS'
  });
  logger.info(`[Scheduler] 🔔 SWP notification created for user ${transaction.user_id}`);
} else if (transaction.transaction_type === 'SIP') {
  await notificationModel.create({
    userId: transaction.user_id,
    title: 'Wealth Builder Alert 🚀',
    message: `✅ Wealth Builder Alert! Your SIP for ${transaction.scheme_name}...`,
    type: 'SUCCESS'
  });
  logger.info(`[Scheduler] 🔔 SIP notification created for user ${transaction.user_id}`);
}
```

#### B. Update `.env.example` with Required Variables

**[MODIFY] .env.example**

```bash
# Cron Email Reports
ENABLE_CRON_REPORTS=true
CRON_REPORT_EMAIL=admin@yourdomain.com  # Required: Admin email for cron reports
ENABLE_TRANSACTION_SCHEDULER_REPORT=true
ENABLE_FULL_SYNC_REPORT=true
```

#### C. Improve Error Handling in cronNotificationService

**[MODIFY] cronNotification.service.js (Line 112)**

```javascript
async sendDailyReport(options = {}) {
    const recipient = process.env.CRON_REPORT_EMAIL;
    
    // Early exit with logging if no recipient
    if (!recipient) {
        console.warn('[CronNotification] ⚠️ CRON_REPORT_EMAIL not configured - skipping email');
        return false;
    }
    
    if (process.env.ENABLE_CRON_REPORTS !== 'true') {
        console.log('[CronNotification] Reports disabled (ENABLE_CRON_REPORTS != true)');
        return false;
    }
    // ... rest of function
}
```

---

## 🌐 Issue 3: MFAPI NAV Fetch Failures

### Error Logs
```json
{"level":"error","message":"[MFAPI Ingestion] NAV fetch failed for 152779:","timestamp":"2026-02-02T08:32:45.170Z"}
{"level":"error","message":"[MFAPI Ingestion] NAV fetch failed for 152778:","timestamp":"2026-02-02T08:32:45.171Z"}
```

### Analysis
These are **low severity** errors. Fund codes 152778 and 152779 are likely:
1. Newly added funds without NAV data yet
2. Inactive/merged funds from the API
3. Temporary API issues

### Current Behavior
✅ The system **gracefully handles** these errors:
- Logs the error
- Continues processing other funds
- No crash or data corruption

### Proposed Enhancement (Optional)

Add a check to skip funds that consistently fail:

```javascript
// In mfapiIngestionService.js - Add failed fund tracking
const MAX_CONSECUTIVE_FAILURES = 3;
const failedFundCache = new Map(); // { schemeCode: failureCount }

async fetchNavData(schemeCode) {
  const failures = failedFundCache.get(schemeCode) || 0;
  if (failures >= MAX_CONSECUTIVE_FAILURES) {
    logger.warn(`[MFAPI Ingestion] Skipping ${schemeCode} - ${failures} consecutive failures`);
    return null;
  }
  // ... existing fetch logic
}
```

---

## Verification Plan

### Automated Tests

1. **Unit Test for Date Formatting**
```javascript
// tests/unit/services/scheduler.service.test.js
describe('executeSWP', () => {
  it('should use YYYY-MM-DD format for last_nav_date', async () => {
    // Mock holdingModel.updateCurrentValue and verify date format
  });
});
```

2. **Integration Test for Notification Creation**
```javascript
describe('Scheduler Notifications', () => {
  it('should create SIP notification after successful execution', async () => {
    // Execute SIP and verify notification in DB
  });
});
```

### Manual Verification

1. **Trigger Test Scheduler Run**
```bash
# SSH into server
docker compose exec backend node -e "
  const { schedulerService } = require('./src/services/scheduler.service.js');
  schedulerService.executeDueTransactions('2026-02-03').then(console.log);
"
```

2. **Check Notification Table**
```sql
SELECT * FROM user_notifications 
WHERE created_at > UNIX_TIMESTAMP('2026-02-02') * 1000 
ORDER BY created_at DESC;
```

3. **Verify Email Configuration**
```bash
docker compose exec backend env | grep -E "(SMTP|CRON|EMAIL)"
```

---

## Implementation Checklist

- [x] **Fix Line 449:** Change `new Date().toISOString()` to `getISTDate()`
- [x] **Fix Lines 376, 388:** Standardize to use `getISTDate()`
- [ ] **Add notification logging** in scheduler.service.js
- [ ] **Update .env.example** with `CRON_REPORT_EMAIL` documentation
- [ ] **Add early exit** in cronNotificationService if email not configured
- [ ] **Run unit tests** for scheduler date formatting
- [ ] **Deploy and verify** no truncation errors in logs
- [ ] **Check notifications** appear in user dashboard after next SIP/SWP execution

---

## Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Date format fix | LOW | getISTDate() is already used elsewhere, proven to work |
| Notification logging | LOW | Read-only addition, no behavior change |
| ENV documentation | NONE | Documentation only |
| Email config check | LOW | Graceful fallback if not configured |

---

## Estimated Timeline

| Task | Duration |
|------|----------|
| Code changes | 30 min |
| Unit tests | 30 min |
| Deployment | 15 min |
| Verification | 15 min |
| **Total** | **~1.5 hours** |
