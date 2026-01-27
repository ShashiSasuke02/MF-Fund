# PLAN: Fund Detail UX Enhancements (NAV Accumulation Phase)

## 1. Objective
Enhance the Fund Details page to provide a professional, data-rich experience immediately, even while daily NAV history is still accumulating.

## 2. Key Features

### A. Risk Mapping (Riskometer)
- **Visual:** SVG Semi-circle Gauge with interactive needle.
- **Logic:** Map `scheme_category` to SEBI Risk Levels (Low, Low to Moderate, Moderate, Moderate to High, High, Very High).
- **Layout:** Replaces the current "ISIN Details" card.

### B. Fund Characterization & Objectives
- **Nature Card:** Identify if the fund is **Equity**, **Debt**, or **Hybrid**.
- **Investment Focus:** Display target objectives like "Capital Growth" or "Stability & Income".

### C. Market Insights & Scale
- **Context Cards:** Show the scale of the fund house and category on the platform.
- **Example:** "One of 45 Large Cap funds" | "122 HDFC Mutual Fund schemes available".

### D. Peer Discovery
- **Logic:** Horizontal scroll of 5 similar funds from the same category.
- **Goal:** Encourage user exploration of related investment options.

### E. Conditional Chart Visibility
- **Logic:** 
  - If Historical Records >= 10: Show `NavChart`.
  - If Historical Records < 10: Hide `NavChart` and show **Accumulation Alert**. (🚀 Building Trend...)

### F. Layout Refactor
- **ISIN Info:** Relocated to the main branded NAV card, below the primary action button.
- **Primary Grid:** Re-ordered to highlight Risk and Objectives.

## 3. Implementation Steps
1. **Backend:** Create `GET /api/funds/:schemeCode/insights` endpoint in `fund.controller.js`.
2. **Frontend:** Implement SVG `Riskometer` component.
3. **Frontend:** Refactor `FundDetails.jsx` layout according to new grid structure.
4. **Verification:** Test across different fund categories (Large Cap vs Liquid).

## 4. Status
- [ ] Backend API
- [ ] Riskometer Component
- [ ] Layout Refactor
- [ ] Peer Discovery Section
- [ ] Accumulation Alerts
