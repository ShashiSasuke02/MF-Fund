# Implementation Plan: Systematic Plans UI Enhancement

## 1. Goal
Enhance the "Systematic Plans" card in the Portfolio page to display relevant future schedule information by **adding a new column**.

**Logic Confirmation:**
*   **Filter:** Only `status = 'SUCCESS'` (Active Plans). *Current backend behavior is correct.*
*   **Frequencies:** Support Daily, Weekly, Monthly, Quarterly. *Backend already supports this.*

**UI Changes:**
*   **Layout:** Update grid from 4 columns to **5 columns** (`md:grid-cols-5`) to fit the new data.
*   **Existing Columns:** Keep Amount, Units, Start Date, Status (implied).
*   **New Column:** 
    *   **SIP:** Display "Next Installment" and the Date.
    *   **SWP:** Display "Next Receivable Payment" and the Date.
    *   **Note:** Do NOT display the amount in this new column.

---

## 2. Change Impact Matrix (Tier 0.5)

| Layer | File | Risk | Reason |
| :--- | :--- | :--- | :--- |
| **Frontend** | `client/src/pages/Portfolio.jsx` | **LOW** | UI grid layout adjustment. |
| **Backend** | N/A | **NONE** | Using existing `next_execution_date` field. |

---

## 3. Implementation Steps

### Step 1: Update `Portfolio.jsx` Card Layout

**Current UI Code:**
```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
  {/* Amount, Units, Start Date, (Status/Other?) */}
</div>
```

**New UI Logic:**
1.  Change grid class to `grid grid-cols-2 md:grid-cols-5`.
2.  Preserve existing "Start Date" block.
3.  Add the new block at the end.

```jsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t border-gray-200">
  {/* 1. Amount */}
  
  {/* 2. Units */}
  
  {/* 3. Start Date (PRESERVED) */}
  <div>
      <p className="text-xs text-gray-600 mb-1 flex items-center">
        {/* Icon */} Start Date
      </p>
      <p className="text-sm font-semibold text-gray-900">
        {plan.start_date ? formatDate(plan.start_date) : 'N/A'}
      </p>
  </div>

  {/* 4. Next Execution (NEW) */}
  <div>
      <p className="text-xs text-gray-600 mb-1 flex items-center">
        <svg ... className="w-4 h-4 mr-1 text-blue-600" ...>
           {/* Calendar Icon */}
        </svg>
        {plan.transaction_type === 'SWP' ? 'Next Receivable Payment' : 'Next Installment'}
      </p>
      <p className="text-sm font-bold text-gray-900">
        {plan.next_execution_date ? formatDate(plan.next_execution_date) : 'Completed'}
      </p>
      {/* Amount removed as per request */}
  </div>
  
  {/* 5. (Remaining column if any, or adjust layout loops) */}
</div>
```

### Step 2: Verification

1.  **Manual Check:** 
    *   Log in as user.
    *   Navigate to Portfolio -> Systematic Plans.
    *   Verify **Next Installment** label for SIP.
    *   Verify **Next Receivable Payment** label for SWP.
    *   Verify **ONLY Date** is shown in the new column (no amount).
    *   Verify layout density (5 columns).

---

## 4. Why No Backend Changes?
The `transactions` table already has the `next_execution_date` column populated by the Scheduler. The API `getSystematicPlans` returns `SELECT *`, so this data is *already available* to the React frontend.
