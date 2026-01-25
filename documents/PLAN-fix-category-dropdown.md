
## 🔍 Debug: Category Dropdown Issue

### 1. Symptom
On the Fund List page, when a user selects a value from the "All Categories" dropdown, the dropdown list updates to show *only* the selected value. The user cannot switch to another category without refreshing or clearing the filter.

### 2. Information Gathered
- **File:** `src/controllers/amc.controller.js` (Backend)
- **Method:** `getFunds`
- **Lines:** 115-160

### 3. Root Cause Analysis
The controller logic derives the list of `available categories` *after* applying the filters.

**Current Logic Flow:**
1.  Fetch all schemes for the AMC.
2.  **Filter schemes** by `search`, `category`, and `sort` query params.
3.  Extract unique categories from the **filtered schemes**.
4.  Return filtered schemes and the restricted category list.

**Example:**
- Initial Load: Data has [Equity, Debt, Hybrid]. Dropdown shows 3 items.
- User Selects "Equity".
- Request: `GET ...?category=Equity`
- Backend filters schemes -> only "Equity" schemes remain.
- Backend extracts categories -> `["Equity"]`.
- Frontend receives `categories: ["Equity"]` -> Dropdown updates to only show "Equity".

### 4. Fix Plan (Backend Only)
We need to decouple the "master list of categories" from the "filtered list of schemes".

**Proposed Logic:**
1.  Fetch `allSchemes` from DB.
2.  **Calculate Categories FIRST** from `allSchemes` (before any filtering).
3.  *Then* apply filtering to `allSchemes` to get `filteredSchemes`.
4.  Return `categories` (full list) and `schemes` (filtered list).

#### Code Changes Required in `src/controllers/amc.controller.js`

**Before:**
```javascript
      // ... fetch schemes ...
      let schemes = await localFundService.getSchemesByFundHouse(fundHouse);

      // ... apply filters to 'schemes' ...
      if (category) { schemes = schemes.filter(...) }

      // ... extract categories from FILTERED 'schemes' ...
      const categories = [...new Set(schemes.map(s => s.schemeCategory).filter(Boolean))].sort();
```

**After (Plan):**
```javascript
      // 1. Fetch all schemes
      const allSchemes = await localFundService.getSchemesByFundHouse(fundHouse);

      // 2. Extract Categories from FULL list immediately
      const uniqueCategories = [...new Set(
        allSchemes
          .map(s => s.schemeCategory)
          .filter(Boolean)
      )].sort();

      // 3. Clone for filtering
      let filteredSchemes = [...allSchemes]; 

      // 4. Apply filters to 'filteredSchemes'
      if (category) {
        filteredSchemes = filteredSchemes.filter(...)
      }

      // 5. Response
      res.json({
        data: {
          categories: uniqueCategories, // Sends FULL list
          schemes: filteredSchemes      // Sends FILTERED list
        }
      });
```

### 5. Verification
- Select "Equity".
- Check Dropdown -> "Equity" is selected, but "Debt" and "Hybrid" are still visible options.
