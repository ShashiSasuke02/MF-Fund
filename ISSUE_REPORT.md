# System Issues: Analysis & Proposed Solutions

**Report Date**: 2026-02-08 IST

---

## 1. Empty Ledger Book
**Issue**: The Ledger Book displays no data even after transactions are performed.

### Root Cause Analysis
The issue stems from a property name mismatch in the `LedgerController`. 
- The authentication middleware populates `req.user` with a property `userId` (derived from the JWT payload).
- The `DemoController` correctly uses `req.user.userId`.
- However, the `LedgerController` was attempting to access `req.user.id`. 
- Since `req.user.id` is `undefined`, the database query `WHERE user_id = ?` was being called with `undefined`, resulting in zero results returned from the database.

### Proposed Solution
Modify `src/controllers/ledger.controller.js` to use `req.user.userId` to align with the rest of the application.

---

## 2. Failed Full Fund Sync
**Issue**: The nightly Full Fund Sync failed with retries.

### Root Cause Analysis
The `mfapi.service.js` has a hardcoded timeout of **15 seconds**. 
The "Full Fund Sync" process uses the `/mf/latest` endpoint, which returns data for approximately **15,000+ mutual funds** in a single JSON response. 
On many networks, and depending on the remote server load, fetching and parsing this massive payload takes longer than 15 seconds. This causes the request to be aborted, triggering retries which also fail for the same reason.

### Proposed Solution
Increase the global API timeout to **60 seconds** in `src/services/mfapi.service.js`. This provides sufficient headroom for large data ingestion tasks.

---

## 3. Portfolio Holding Filter Bug
**Issue**: Holding filters (Equity, Debt, etc.) are not displaying all holdings.

### Root Cause Analysis
The filtering on the Portfolio page relies on the `scheme_category` field. 
1. **Data Dependency**: The `scheme_category` is populated during the Fund Sync process. Since the sync failed (as noted above), many funds in the database may have `null` or missing categories.
2. **UI Logic**: The frontend filter `h.scheme_category?.toLowerCase().includes('debt')` will fail silently if the category is null, causing the holding to be hidden from the Debt tab.
3. **Fallback**: If a fund isn't classified, it should ideally appear in the "Other" tab, but the `demo.service.js` was returning `null` for missing categories instead of a default string that the UI can catch.

### Proposed Solution
1. **Fix Sync**: Fixing the timeout will allow the sync to finish and populate categories correctly.
2. **Backend Fallback**: Update `src/services/demo.service.js` to return `'Other'` if the database category is missing, ensuring those holdings are always visible in the "Other" tab.

---

## Conclusion
The system is fundamentally sound, but is suffering from a few "glue" issues (naming mismatches and timeout constraints). Once implemented, these fixes will restore full visibility to the Portfolio and Ledger Book.

**Do I have your explicit permission to proceed with these changes?**
