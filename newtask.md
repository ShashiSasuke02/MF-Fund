# MF-Investments Source of Truth (newtask.md)

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
- **Admin AI Manager (Saved):** [PLAN-admin-ai-manager.md](file:///c:/Users/shashidhar/Desktop/MF-Investments/docs/PLAN-admin-ai-manager.md)
    - Enable/Disable AI globally via Admin Dashboard.
    - Select and persist Ollama models dynamically.
    - New `system_settings` table.

## ✅ Completed Implementation Details
- **Project Cleanup:** Moved "unwanted" loose files (plans, debug scripts, logs) to `Extras/` folder.
- Initial environment and protocol audit.
- Confirmed understanding of `GEMINI.md`, `ARCHITECTURE.md`, and Specialist Agents.
- **Logging Upgrade:** Replaced `console.log` with `logger` in critical services (`scheduler`, `demo`, `mfapiIngestion`).
- **SWP Fix:** Enabled `WEEKLY` frequency and relaxed start date validation (allowed from tomorrow).
- **Exclusion Filters:** Refined keywords (Removed REINVESTMENT/MIP) to include more valid funds.
- **Admin Feature:** Implemented "Download All Logs" (ZIP) in Admin Dashboard.
- **AdSense Dev Mode:** Implemented visible placeholders for development to verify layout without real ads.
- **UI Consistency:** Removed opaque background from "Report Issue" page, applying global background + glassmorphism.
- **Portfolio Ads:** Added second banner ad unit to bottom of Portfolio page for better inventory.
- **Session Security:** Tightened Idle Timeout to **2 minutes** (was 3). Stale closure bug fixed with Refs.


## 🔍 System State & New Data Structures
- **DB Schema:** `src/db/schema.sql` (Master truth).
- **Design Tokens:** Primary Green: `#24D17E`, Font: `Inter`.
- **Infrastructure:** Docker Compose (Node + MySQL).
