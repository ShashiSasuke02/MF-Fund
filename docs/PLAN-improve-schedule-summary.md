# Plan: Improve Schedule Summary & Default Duration

## 1. Current State Analysis
- **Behavior:** The "Schedule Summary" card appears as soon as a `Start Date` is selected.
- **Logic:** Calls `calculateSchedulePreview`. If `endDate` is missing, it defaults to generated 500 installments (effectively "Infinite/Until Stopped").
- **User Issue:** 
    - The immediate "Infinite" summary might be overwhelming or cluttered.
    - User specifically wants the summary **only** when an `End Date` is chosen.
    - User wants a **1-Year Default** duration if no End Date is chosen (instead of "Until Stopped").

## 2. Proposed Changes

### A. Frontend Display Logic (`client/src/pages/Invest.jsx`)
**Goal:** Hide "Schedule Summary" if `End Date` is empty.

- **Current:**
  ```javascript
  useEffect(() => {
    if (transactionType !== 'LUMP_SUM' && formData.startDate && formData.frequency) {
       // Calculates preview (defaults to infinite if no endDate)
    }
  }, ...);
  ```
- **New Logic:**
  ```javascript
  useEffect(() => {
    // STRICT CHECK: Only run if endDate is present
    if (transactionType !== 'LUMP_SUM' && formData.startDate && formData.endDate && formData.frequency) {
       // Calculate preview
    } else {
       setSchedulePreview([]); // Clear preview if no endDate
    }
  }, ...);
  ```

### B. Default Duration Logic (`client/src/pages/Invest.jsx`)
**Goal:** If User submits *without* an `End Date`, automatically set it to 1 Year from Start Date.

- **Current:** `endDate` is sent as `undefined` (backend interprets as "No End Date" / "Forever").
- **New Logic (in `handleSubmit`)**:
  ```javascript
  let finalEndDate = formData.endDate;

  if (transactionType !== 'LUMP_SUM' && !finalEndDate) {
      // Default to 1 Year
      const start = new Date(formData.startDate);
      const oneYearLater = new Date(start);
      oneYearLater.setFullYear(start.getFullYear() + 1);
      // Adjust for leap years if needed, or arguably setDate(date - 1) for exact 365 days term? 
      // Standard practice: Same date next year.
      finalEndDate = oneYearLater.toISOString().split('T')[0];
      
      // Optional: Inform user? "Setting default duration to 1 year"
  }
  
  const transactionData = {
      ...
      endDate: finalEndDate
  };
  ```

## 3. Impact
- **UI:** Cleaner interface. Summary only pops up when the user explicitly defines the range.
- **Behavior:** No more accidental "Forever" SIPs. Users must explicitly clear the end date (which we won't allow easily if we enforce 1 year default) or we just treat "Empty" as "1 Year".

## 4. Verification
- **Test 1:** Select Start Date -> Verify **NO** Summary.
- **Test 2:** Select End Date -> Verify Summary appears.
- **Test 3:** Clear End Date -> Verify Summary disappears.
- **Test 4:** Submit with Empty End Date -> Verify Backend receives `endDate` = Start + 1 Year.
