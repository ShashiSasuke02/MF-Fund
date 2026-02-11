# MF-Investments Source of Truth (newtask.md)

> [!CAUTION]
> **STRICT IMPLEMENTATION RULE (User Defined)**
> 1. **NO IMPLEMENTATION WITHOUT PERMISSION:** The AI must NEVER implement code, change configuration, or deploy changes without explicit, written order/permission from the user.
> 2. **DOUBLE VERIFICATION:** Before implementing ANYTHING, the AI must "double sure verify" the user's approval.
> 3. **PLAN FIRST:** Always present a plan and wait for "Proceed" or "Approved" before writing code.

## Current Project State
- **Core Strategy:** Full-stack paper-trading platform for Indian Mutual Funds.
- **Backend:** Node.js/Express, MySQL, Node Cron.
- **Frontend:** React 18 (Vite), Tailwind CSS.
- **Status:** Active development. Recent changes include IST timezone fixes, relaxed NAV date filters, and UI enhancements (Signup bento grid, etc.).

## 📝 Current Implementation Plan
- **Node.js Error Handling & UX Review:** [Node.js Error Handling & UX Review.md](file:///c:/Users/shashidhar/Desktop/MF-Investments/docs/Node.js%20Error%20Handling%20&%20UX%20Review.md)
    - Centralize errors via `AppError` class.
    - Refactor `errorHandler` middleware.
    - Implement `useErrorFocus` hook for form accessibility.
    - Enhance `ErrorMessage` UI component.
- **Mobile UI "Pro Max" (Responsive Web):** [PLAN-mobile-ui.md](file:///C:/Users/shashidhar/.gemini/antigravity/brain/d65cdacf-db26-4186-ac9c-55a0269665dd/implementation_plan.md)
    - Implement Sticky Bottom Navigation with "Glassmorphism" design.
    - Create "Addictive" interactions (Bento Grid, Pulse Animations, Swipe-to-Invest).
    - Responsive optimization for existing pages (`Landing`, `Dashboard`, `Invest`).
- **AdSense Visibility Control:** Implemented env-based toggle.
    - Used `VITE_isAdsEnabled` for strict control.
    - Dynamic script injection (no hardcoded index.html script).
    - Components render `null` when disabled (no placeholders).
- **Log Management:** Configured `docker-compose.yml` to use bind mounts (`./logs`) for direct log access.
    - Enable/Disable AI globally via Admin Dashboard.
    - Select and persist Ollama models dynamically.
    - New `system_settings` table.
- **VPS Deployment (Pending):** [PLAN-vps-deploy.md](file:///c:/Users/shashidhar/Desktop/MF-Investments/docs/PLAN-vps-deploy.md)
    - Deploy to VPS with Nginx Proxy Manager.
    - Configure SSL and domain routing for `www.trymutualfunds.com`.
- **Standardize Peer Fund Logic:** [implementation_plan.md](file:///c:/Users/shashidhar/.gemini/antigravity/brain/e6b04d63-b606-4111-aa07-8452e33af837/implementation_plan.md)
    - Centralize `extractBaseName` logic in `fund.utils.js`.
    - Update `peerEnrichment.service.js` and `fund.controller.js`.
    - Add unit tests.

## ✅ Completed Implementation Details
- **Project Cleanup:** Moved "unwanted" loose files (plans, debug scripts, logs) to `Extras/` folder.
- [x] Final verification and walkthrough <!-- id: 7 -->
- [x] All tests verified and passing (117 total) <!-- id: 20 -->
- [x] ARCHITECTURE.md updated with recent shifts <!-- id: 21 -->
- [x] Project committed and pushed to git <!-- id: 22 -->
- Confirmed understanding of `GEMINI.md`, `ARCHITECTURE.md`, and Specialist Agents.
- **Logging Migration:** Migrated 100% of the backend (src/) from `console.log` to the centralized `logger` service for structured observability.
- **Sync Optimization:** Disabled Incremental Fund Sync (config-only); enabled AMFI NAV Sync daily reports via email (`ENABLE_AMFI_SYNC_REPORT`).
- **SWP Fix:** Enabled `WEEKLY` frequency and relaxed start date validation (allowed from tomorrow).
- **Exclusion Filters:** Refined keywords (Removed REINVESTMENT/MIP) to include more valid funds.
- **Admin Feature:** Implemented "Download All Logs" (ZIP) in Admin Dashboard.
- **AdSense Dev Mode:** Implemented visible placeholders for development to verify layout without real ads.
- **UI Consistency:** Removed opaque background from "Report Issue" page, applying global background + glassmorphism.
- **Portfolio Ads:** Added second banner ad unit to bottom of Portfolio page for better inventory.
- **Session Security:** Tightened Idle Timeout to **2 minutes** (was 3). Stale closure bug fixed with Refs.

- **Infrastructure Hardening (Feb 2026):** Implemented custom MySQL Dockerfile and build optimizations.
- **SEO Phase 2:** Full integration of dynamic meta and rich snippets.
- **Frontend API Fix:** Replaced undefined `api` calls with standard `fetchApi` in `client/src/api/index.js`, fixing Portfolio page failures.
- **Ledger System Overhaul (Feb 2026):**
    - **Display Fix:** `LedgerTable.jsx` now shows unique `Ref: #{entry.id}` instead of duplicate Plan IDs.
    - **Data Integrity:** Implemented `demoAccountModel.createDefault()` to ensure new accounts start with an "Opening Balance" ledger entry (`auth.controller.js` + `user.model.js`).
    - **Architecture:** Updated `ARCHITECTURE.md` to define Ledger as the single source of truth.


## 📝 Implementation Strategy: Debugging & Analysis (Current)
- **Problem Analysis**: [ISSUE_REPORT.md](file:///c:/Users/shashidhar/Desktop/MF-Investments/ISSUE_REPORT.md)
- **Implementation Plan**: [implementation_plan.md](file:///C:/Users/shashidhar/.gemini/antigravity/brain/31484b97-1319-4be5-a1df-a75e62a321d7/implementation_plan.md)

## ✅ Completed: Project Audit & Maintenance
- **Goal**: Finalize Zoho transition, fix maintenance bugs, and verify system integrity.
- **Verification**: 100% test pass rate (114 unit, 3 integration).
- **Status**: Committed and pushed to `Local-API-Setup`.
- **Goal**: Restrict all executions to Mon-Fri. Saturday/Sunday orders stay PENDING.
- **Logic**: Next installments calculated from Executed Day.
- **Plan**: [PLAN-weekday-transactions.md](file:///c:/Users/shashidhar/Desktop/MF-Investments/docs/PLAN-weekday-transactions.md)

### 1. Ledger Book Fix
- **Fix**: Update `src/controllers/ledger.controller.js` to use `req.user.userId`.

### 2. MFAPI Sync Fix
- **Fix**: Increase `TIMEOUT_MS` to 60,000 in `src/services/mfapi.service.js`.

### 3. Portfolio Filter Robustness
- **Fix**: Default `scheme_category` to `'Other'` in `src/services/demo.service.js`.

## Architecture Compliance Check
- **ARCHITECTURE.md read fully**: YES
- **Existing functionality affected**: NO (Debug fixes only)
- **Change confined to approved extension points**: YES
- **Any existing code modified**: YES (Fixes only)
- **Any existing code modified**: YES (Fixes only)
- **Risk of behavioral regression**: LOW

### 4. Forgot Password (Redis)
- **Feature**: Zero-Schema OTP Reset Flow.
- **Backend**: `auth.controller.js` (Redis-based), `email.service.js` (Transactional Emails).
- **Frontend**: `ForgotPassword.jsx` (3-Step Wizard).
- **Security**: Rate-limited, 10m TTL, Atomic Verification.
