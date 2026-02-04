# Analysis: Removing NAV History

## 1. User Question
"If we don't want to save NAV history, will it become easier?"

## 2. Executive Summary
**Answer: No.** Removing NAV history would likely **increase complexity** in other areas and **break key features** of the application.

While it seems simpler to store just a single "Current NAV" in the `funds` table, the cleanup and functionality loss outweighs the storage savings.

## 3. Impact Analysis

### A. Scheduler & Transaction Accuracy (High Risk)
-   **Current Behavior:** The Scheduler uses `targetDate` to find Due Transactions. If the server is down yesterday and runs today for yesterday's transactions, it *should* ideally use Yesterday's NAV.
-   **If History Removed:** We only have "Today's NAV".
    -   **Consequence:** "Yesterday's" SIP would be executed at "Today's" price. This causes "Slippage" (User gets fewer/more units than they should have).
    -   **Verdict:** This makes the 'Paper Trading' aspect inaccurate.

### B. User Interface (High Impact)
The `FundDetails` page relies heavily on history:
1.  **NAV Chart:** Requires at least 7-30 days of data points. **Feature would be removed.**
2.  **Recent History Table:** Displays last few days' prices and % change. **Feature would be removed.**
3.  **1-Day Return:** Calculated by comparing Today vs Yesterday. Without history, we rely 100% on external API metadata which might be empty.

### C. Code Refactoring Effort (Medium Effort)
To remove the table, we would need to:
1.  **Modify Schema:** Add `current_nav` and `nav_as_of` columns to `funds` table.
2.  **Migrate Data:** Move latest values from `fund_nav_history` to `funds`.
3.  **Rewrite Queries:** Update `localFundService`, `AmcList`, and `FundDetails` to stop joining `fund_nav_history`.
4.  **Rewrite Ingestion:** Change `mfapiIngestion` to update `funds` row instead of inserting history.
5.  **Rewrite UI:** Remove Chart components and History tables from React code.

## 4. Alternate Solution (Recommended)
If simple **Storage/Performance** is the concern, we are *already* optimized:
-   **Retention Policy:** The system currently keeps only **30 days** of history (`NAV_RETENTION_COUNT = 30` in `mfapiIngestion.service.js`).
-   **Auto-Pruning:** The sync job automatically deletes records older than 30 days.

**Recommendation:**
Keep `fund_nav_history` as is. It provides the necessary data for Charts and Scheduler accuracy, and the built-in pruning already prevents database bloat.
