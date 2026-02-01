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
- **AdSense Visibility Control:** Implemented env-based toggle.
    - Used `VITE_isAdsEnabled` for strict control.
    - Dynamic script injection (no hardcoded index.html script).
    - Components render `null` when disabled (no placeholders).
- **Log Management:** Configured `docker-compose.yml` to use bind mounts (`./logs`) for direct log access.

## ✅ Completed Implementation Details
- Initial environment and protocol audit.
- Confirmed understanding of `GEMINI.md`, `ARCHITECTURE.md`, and Specialist Agents.
- **Logging Upgrade:** Replaced `console.log` with `logger` in critical services (`scheduler`, `demo`, `mfapiIngestion`).
- **SWP Fix:** Enabled `WEEKLY` frequency for SWP transactions.
- **Admin Feature:** Implemented "Download All Logs" (ZIP) in Admin Dashboard.

## 🔍 System State & New Data Structures
- **DB Schema:** `src/db/schema.sql` (Master truth).
- **Design Tokens:** Primary Green: `#24D17E`, Font: `Inter`.
- **Infrastructure:** Docker Compose (Node + MySQL).
