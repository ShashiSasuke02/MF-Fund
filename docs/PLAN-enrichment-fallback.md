# Implementation Plan - Peer Fund Enrichment Fallback (Updated)

## Goal
Implement a simplified fallback mechanism to enrich fund details by matching the **exact Base Name** of a fund when direct enrichment fails.

## Logic Overview
**Input Example:** `ICICI Prudential Bharat Consumption Fund - Growth Option`

1.  **Extract Base Name:** Split by ` - ` and take the first part.
    *   Result: `ICICI Prudential Bharat Consumption Fund`
2.  **Exact Search:** Search the database for a record where `scheme_name` is **exactly** equal to the Base Name.
    *   Query: `WHERE scheme_name = 'ICICI Prudential Bharat Consumption Fund'`
3.  **Merge Data:** If found, copy metadata (AUM, Manager, etc.) to the target fund.

## Changes

### 1. `fund.model.js`
Update `findPeerFundWithData` to use an exact equality check.
```sql
SELECT * FROM funds 
WHERE scheme_name = ? 
  AND scheme_code != ?
  AND aum IS NOT NULL 
  AND aum > 0
LIMIT 1;
```

### 2. `fund.controller.js`
Ensure the base name is extracted and passed correctly to the model.

## Implementation Steps
- [ ] Update `fund.model.js` with exact match query.
- [ ] Update `fund.controller.js` logic.
- [ ] Verify with a manual lookup.
