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

## ✅ Completed Implementation Details
- **Project Cleanup:** Moved "unwanted" loose files (plans, debug scripts, logs) to `Extras/` folder.
- Initial environment and protocol audit.
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
- **Strict Ledger Plan:** Approved architecture policy and implementation plan created. Integration targeted for Portfolio "Report" tab.
- **AI Manager Visibility (Feb 2026):** Fixed bug where AI widget was visible even when disabled. Added `ai_enabled` system setting check to frontend.
- **Ledger Model Fix (Feb 2026):** Resolved `TypeError` in `LedgerModel` by correcting database wrapper usage (`pool.run` vs `pool.execute`).

## 📝 Implementation Strategy: Debugging & Analysis (Current)
- **Problem Analysis**: [ISSUE_REPORT.md](file:///c:/Users/shashidhar/Desktop/MF-Investments/ISSUE_REPORT.md)
- **Implementation Plan**: [implementation_plan.md](file:///C:/Users/shashidhar/.gemini/antigravity/brain/31484b97-1319-4be5-a1df-a75e62a321d7/implementation_plan.md)

## ✅ Completed: Zoho Email Transition
- **Goal**: Switched SMTP from Brevo to Zoho Mail Lite.
- **Implementation**: Updated `EmailService` to handle SSL/TLS and prepared `.env` placeholders.
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
- **Risk of behavioral regression**: LOW
