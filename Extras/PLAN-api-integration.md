# Implementation Plan: Captain Nemo API Integration

**Goal:** Enrich Fund Details with external data (AUM, Return, Risk) using `mf.captnemo.in` API, with a local caching strategy and safe UX.

## 1. Safety & Fallback Strategy (CRITICAL)

### Fallback Logic
We must handle three states for every data point:
1.  **Data in DB:** Show DB Value.
2.  **Data in API:** Update DB -> Show API Value.
3.  **Data Missing (Both):** **Display "N/A"**.

*   **Database:** Columns will default to `NULL`.
*   **Frontend:** `value={data?.aum || 'N/A'}`. Even if the API fails or returns partial data, the UI will gracefully show "N/A" without crashing.

## 2. Impact Analysis & Regression Prevention

### Database Schema (`funds` table)
*   **Change:** Adding nullable columns (`aum`, `risk_level`, etc.).
*   **Impact:** Safe. Existing rows will have `NULL` values. Existing queries using `SELECT *` will just get extra fields.
*   **Risk:** `INSERT` statements in `FundSyncService` (MFAPI sync) might fail if they hardcode column lists and don't account for new columns.
    *   *Mitigation:* Verify `FundSyncService` uses named columns or allows defaults.

### Impacted Files & Queries

| Component | File | Impact | Action Required |
| :--- | :--- | :--- | :--- |
| **Schema** | `schema.sql`, `init-db.sql` | Table definition change. | Add migration script. |
| **Model** | `fund.model.js` | `findById` query. | Ensure it selects new columns. |
| **Sync Service** | `localFundService.js` | `insert/upsert` logic. | Check if explicit column list needs updating. |
| **Controller** | `fund.controller.js` | `getFundDetails`. | Add enrichment orchestration. |
| **Frontend** | `FundDetails.jsx` | UI Rendering. | Map new fields, handle loading/error. |

## 3. Database Schema Updates

```sql
ALTER TABLE funds
ADD COLUMN aum DECIMAL(20, 2) DEFAULT NULL,
ADD COLUMN expense_ratio VARCHAR(20) DEFAULT NULL,
ADD COLUMN risk_level VARCHAR(50) DEFAULT NULL,
ADD COLUMN returns_1y DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN returns_3y DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN returns_5y DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN min_lumpsum DECIMAL(15, 2) DEFAULT NULL,
ADD COLUMN min_sip DECIMAL(15, 2) DEFAULT NULL,
ADD COLUMN investment_objective TEXT DEFAULT NULL,
ADD COLUMN more_details_url TEXT DEFAULT NULL,
ADD COLUMN fund_manager VARCHAR(255) DEFAULT NULL,
ADD COLUMN detail_info_synced_at BIGINT DEFAULT NULL;
```

## 4. Backend Implementation

### Service: `src/services/fundEnrichment.service.js` (NEW)
*   **Function:** `enrichFundData(schemeCode, isin)`
*   **Error Handling:** Wrap external API call in `try-catch`.
    *   If API 404/500: Log error, return `NULL` (don't crash).
    *   UI receives `NULL`, displays "N/A".
*   **Logic:**
    1.  Call `https://mf.captnemo.in/kuvera/{isin}`.
    2.  Map API response to DB columns.
    3.  Update `funds` table with new data and `detail_info_synced_at`.
    4.  Return the mapped data object.

### Controller: `src/controllers/fund.controller.js`
*   **Update:** `getFundDetails`
*   **Logic Flow:**
    1.  Get Fund.
    2.  Check if `detail_info_synced_at` is present.
    3.  **If Synced:** Return DB data.
    4.  **If Not Synced:**
        -   Call `enrichFundData` (Await this).
        -   `catch (err)` -> Log error, return existing DB data (Partial fallback).
        -   Return merged result.

## 5. Frontend Implementation

### Component: `client/src/pages/FundDetails.jsx`

**State Management**
-   `isEnriching`: Boolean. True when waiting for API response.
-   `blockNavigation`: Boolean. True when `isEnriching` is active.

**Blocking Navigation**
-   Use `useBlocker` (React Router v6) to prevent navigation action if `blockNavigation` is true.
-   **Loading Overlay:**
    -   Full-screen transparent black overlay.
    -   Spinner/Animation.
    -   Text: *"Syncing latest fund details... Please wait."*

**Data Display**
-   Replace "N/A" placeholders with real data.
-   **Label Update:** "CRISIL Rating" -> **"Risk Level"**.

## 6. Verification Plan

1.  **Schema Check:** Verify `funds` table allows NULLs for new columns.
2.  **API Failure Test:** temporarily break the API URL -> Ensure page loads with "N/A" and no crash.
3.  **Partial Data Test:** Mock API response with missing fields -> Ensure mixed Data/"N/A" display.
4.  **Regression:** Run full sync (MFAPI) to ensure new columns don't break existing sync logic.
