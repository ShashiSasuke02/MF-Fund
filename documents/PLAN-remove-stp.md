
# PLAN-remove-stp: Frontend-Only STP Decommissioning (Soft Removal)

## 1. Goal
Hide the STP feature from the User Interface while preserving the Backend and Database capabilities for potential future use. This ensures zero risk to existing data structure and allows easy reactivation.

## 2. Strategy: "Soft Removal"
- **Frontend:** Remove access points (buttons, calculators, filters).
- **Backend:** **NO CHANGE**. Logic remains but enters a "dormant" state (dead code path).
- **Database:** **NO CHANGE**. Schema remains compatible.

## 3. Execution Steps

### Phase 1: Frontend Cleanup (Hide UI)
#### 1. Invest Page (`client/src/pages/Invest.jsx`)
- [ ] Remove "STP" button from the `Transaction Type` selection grid.
- [ ] Ensure default selection logic handles cases where STP might have been pre-selected.
- [ ] **Cleanup:** Verify "Important Information" card is removed for ALL transaction types (Lump Sum, SIP, SWP).

#### 2. Calculators (`client/src/pages/Calculator.jsx`)
- [ ] Remove `STPCalculator` import.
- [ ] Remove "STP Calculator" tab/card from the list.
- [ ] *Action:* We will NOT delete `STPCalculator.jsx` file, just unlink it.

#### 3. Portfolio (`client/src/pages/Portfolio.jsx`)
- [ ] Remove "STP" filter option (if present).
- [ ] *Note:* If user has *historical* STP transactions, they will still render in the list (which is correct/safe).

#### 4. Google AdSense (`client/google-adsense-strategy.js`)
- [ ] Remove reference to `STPCalculator.jsx` to prevent ad script errors on missing component.

### Phase 2: Verification
- **Safety Check:** Ensure `SIP` and `SWP` continue to work.
- **Future Proofing:** Document that "STP support exists in backend but is hidden in frontend."
