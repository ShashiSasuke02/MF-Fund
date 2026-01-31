# Implementation Plan: Landing UI & Calculator Updates

## 1. Problem Statement
**Issue:**
1.  **Tab Names:** The navigation tabs "Asset Managements" and "Investment Calculator" need clearer, standard names.
2.  **Calculator Logic:** Calculators strictly enforce "round number" inputs (e.g., multiples of 500 or 1000), preventing users from entering precise amounts like `501`, `1000.50`, or `809`.

## 2. Solution Specification

### 2.1 UI Renaming
*   **Asset Managements** -> **Mutual Funds**
*   **Investment Calculator** -> **Calculators**

### 2.2 Calculator Logic Generalized Rules
*   **Constraint 1 (Decimals):** Change `step` to `"any"` (or `0.01`) to allow decimals.
*   **Constraint 2 (Minimum):**
    *   **Investment Schemes (SIP/FD/RD/etc.):** Minimum **₹500** (as requested).
    *   **Loans:** Minimum **₹10,000** (existing logic, keep unless User says otherwise, but allow non-multiples).
*   **Constraint 3 (Rounding):** Remove any code that forces rounding to nearest 500/1000.

---

## 3. Implementation Steps

### Step 1: Rename Navigation Tabs
**File:** `client/src/components/Layout.jsx`
*   Update text for **Desktop** and **Mobile** navigation links.

### Step 2: Update Calculator Inputs (By Type)

#### A. Mutual Fund Calculators (SIP, SWP, STP)
*   **Files:** `SIPCalculator.jsx`, `SWPCalculator.jsx`, `STPCalculator.jsx`
*   **Field:** `monthlyInvestment` / `totalInvestment` / `withdrawalAmount`
*   **Change:** `min="500"`, `step="any"` (was `step="500"`)
*   **Note:** Remove "Multiples of 500" helper text.

#### B. Banking & Post Office Schemes (FD, RD, PPF, SSA, MIS, NSC, KVP)
*   **Files:** `FDPayoutCalculator.jsx`, `FDCumulativeCalculator.jsx`, `RDCalculator.jsx`, `PPFCalculator.jsx`, `SSACalculator.jsx`, `POMISCalculator.jsx`, `NSCCalculator.jsx`, `SCSSCalculator.jsx`
*   **Field:** `investmentAmount` / `monthlyInvestment` / `depositAmount`
*   **Change:** `min="500"` (or existing min if < 500), `step="any"`
*   **Note:** SSA/PPF might have specific legal minimums (e.g. 250/500), respect the *legal* minimum but remove the *step* restriction.

#### C. Loan Calculators
*   **Files:** `LoanBasicCalculator.jsx`, `LoanAdvancedCalculator.jsx`
*   **Field:** `principal` (Loan Amount)
*   **Change:** `min="10000"` (Keep high min for loans), `step="any"` (was `step="1000"`)
*   **Note:** Allow specific loan amounts like `105,432`.

#### D. Retirement (NPS, EPF, APY)
*   **Files:** `NPSCalculator.jsx`, `EPFCalculator.jsx`, `APYCalculator.jsx`
*   **Field:** `monthlyContribution` / `basicSalary`
*   **Change:** `step="any"`
*   **Note:** Ensure accurate salary inputs are possible.

---

## 4. Verification Plan

### 4.1 Manual Verification (UI)
1.  Check Navigation Bar text on PC and Mobile.

### 4.2 Calculator Input Tests
| Calculator Type | Test Input | Expected Result |
| :--- | :--- | :--- |
| **SIP** | `501` | Accepted |
| **SIP** | `500.50` | Accepted |
| **Loan** | `12345` | Accepted |
| **FD** | `1000.99` | Accepted |
| **General** | `499` | **Error** (Min 500 violated) |
