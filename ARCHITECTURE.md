# Project Architecture & Codebase Reference

## 1. High-Level Overview

**Project Name:** MF-Investments (MF Selection App)
**Purpose:** A full-stack paper-trading platform for Indian Mutual Funds. It filters data from 12 major AMCs, allows users to simulate investments (SIP, SWP, STP, Lump Sum), and track portfolio performance using a virtual demo account.
**Deployment Model:** Dockerized Monolith. The React frontend is built and served via the Node.js Express backend in production. Designed for **TrueNAS SCALE** deployment as a Custom App.

### Technology Stack
-   **Frontend:** React 18 (Vite), Tailwind CSS, React Router v6, Recharts.
-   **Backend:** Node.js, Express.js.
-   **Database:** MySQL 8.0 (with `mysql2` connection pool).
-   **Infrastructure:** Docker Compose, Nginx (optional proxy), Node Cron.
-   **External APIs:** 
    -   `api.mfapi.in` (Primary Data Source for Indian Mutual Funds).
    -   "Captain Nemo" Integration (Enrichment Service for AUM/Outcome data).

---

## 2. Repository Structure

```
├── client/                 # React Frontend application
│   ├── src/
│   │   ├── api/            # API abstraction layer (Axios instances)
│   │   ├── components/     # Reusable UI components (Layout, Loaders, Ads)
│   │   ├── contexts/       # Global State (AuthContext, IdleContext)
│   │   ├── pages/          # Route Views (FundList, Portfolio, Admin)
│   │   └── Main.jsx        # Entry point
│   │   ├── pages/          # Route Views (FundList, Portfolio, Admin)
│   │   └── Main.jsx        # Entry point
│   ├── vite.config.js      # Build configuration
│   └── .env                # FRONTEND Config (Vite, AdSense) - NOT in root!
├── src/                    # Node.js Backend application
│   ├── config/             # Environment & Constants
│   ├── controllers/        # Request Handlers (MVC)
│   ├── db/                 # Database Connection & Schema
│   │   ├── database.js     # Connection Pool Wrapper
│   │   └── schema.sql      # Database DDL Source of Truth
│   ├── jobs/               # Cron Job Definitions
│   ├── middleware/         # Auth, Logger, Error Handling
│   ├── models/             # Data Access Objects (DAO) / ORM-lite
│   ├── routes/             # Express Route Definitions
│   ├── services/           # Business Logic (Ingestion, Scheduler)
│   ├── app.js              # Express App Configuration
│   └── server.js           # Server Bootstrap & Cron Init
├── docker/                 # Docker Resources
│   ├── init-db.sql         # DB Initialization script
│   └── nginx.conf          # Reverse Proxy Config
├── scripts/                # Utility Scripts (Sync Triggers, Admin Seed)
├── docker-compose.yml      # Orchestration Config
└── package.json            # Root Dependencies
```

---

## 3. Backend Architecture

### 3.1 Entry Points
-   **`src/server.js`**: The process entry point. It connects to the MySQL database, initializes `scheduler.job.js` (Cron Registry), and starts the Express HTTP server.
-   **`src/app.js`**: Configures middleware (Helmet, CORS, RateLimit), mounts API routes under `/api`, and sets up static file serving for the React client in production.

### 3.2 Routing & Controllers
-   **Pattern:** RESTful API.
-   **Location:** `src/routes/*.routes.js` maps endpoints to `src/controllers/*.controller.js`.
-   **Key Controllers:**
    -   `fund.controller.js`: Read-only access to fund data (delegates to `localFundService`).
    -   `auth.controller.js`: Handles Login, Register, OTP verification.
    -   `scheduler.controller.js`: Manages manual transaction triggers (if exp. enabled).

### 3.3 Services & Business Logic
This is the core of the application. Logic is strictly separated from Controllers.
-   **`mfapiIngestion.service.js` (CRITICAL):** 
    -   Handles the nightly sync from `api.mfapi.in`.
    -   **Optimization:** Uses `/mf/latest` to fetch bulk data instead of N+1 calls.
    -   **Filters:** Strict whitelist of 12 AMCs + Exclusion of "IDCW", "Dividend" plans.
    -   **Writes to:** `funds`, `fund_nav_history`, `fund_sync_log`.
-   **`scheduler.service.js` (CRITICAL):**
    -   The "Engine" for paper trading.
    -   Executes PENDING transactions from the `transactions` table.
    -   **Logic:** Locks row -> Checks Balance (`demo_accounts`) -> Calculates Units (using Local NAV) -> Updates `holdings` -> Updates Balance -> Logs to `execution_logs`.
    -   **Self-Contained:** Does **NOT** call external APIs. Relies on data already synced to `fund_nav_history`.
-   **`localFundService.js`**: Read-only service for fetching fund data from MySQL for the UI.

### 3.4 Data Access Layer
-   **Pattern:** Repository/DAO Pattern (no full ORM).
-   **Location:** `src/models/*.model.js`.
-   **Implementation:** Raw SQL queries via `mysql2` pool.
-   **Consistency:** Models perform database writes. Services coordinate complex flows involving multiple models.

### 3.5 Database Schema
(Defined in `src/db/schema.sql`)
-   **`funds`**: Master list of schemes (Scheme Code is PK). Enriched with AUM/Expense Ratio.
-   **`fund_nav_history`**: Time-series data for NAVs. Unique key: `(scheme_code, nav_date)`.
-   **`users` / `demo_accounts`**: User data and virtual wallet balance.
-   **`transactions`**: High-fidelity log of every Buy/Sell order.
-   **`holdings`**: Aggregate snapshot of user's portfolio.
-   **`amc_master`**: Whitelist configuration.

### 3.6 Authentication & Authorization
-   **Strategy:** JWT (JSON Web Tokens).
-   **Flow:** Login -> Server signs JWT -> Client stores in SessionStorage -> Client sends `Authorization: Bearer <token>`.
-   **Middleware:** `src/middleware/auth.middleware.js` protects routes.
-   **Roles:** Simple 'user' vs 'admin' role column in `users` table.

### 3.7 Error Handling & Logging
-   **Global Handler:** `src/middleware/errorHandler.js` catches async errors.
-   **Logging:** `winston` (via `requestLogger.middleware.js`) + Database-backed logs (`cron_job_logs`, `fund_sync_log`).

### 3.8 Configuration
### 3.8 Configuration Architecture
-   **Dual-Config Strategy:**
    1.  **Backend (`/.env`):** Server secrets (`DB_PASSWORD`, `JWT_SECRET`, `PORT`). **NEVER** exposed to client.
    2.  **Frontend (`/client/.env`):** Build-time variables (`VITE_ADSENSE_CLIENT_ID`, `VITE_isAdsEnabled`). **Visible** in browser bundle.
-   **Docker:** variables passed via `docker-compose.yml` take precedence over root `.env`.

---

## 4. Frontend Architecture

### 4.1 Application Bootstrap
-   **`main.jsx`**: Mounts React root.
-   **`App.jsx`**: Defines Routes (`react-router-dom`) and wraps app in `AuthProvider`.

### 4.2 Routing
-   **Public:** `/`, `/browse`, `/fund/:id`, `/login`.
-   **Protected (`ProtectedRoute` wrapper):** `/portfolio`, `/invest`.
-   **Admin (`AdminRoute` wrapper):** `/admin/dashboard`.

### 4.3 Component Structure
-   **`components/`**: Reusable UI (e.g., `FundCard`, `HoldingsTable`).
-   **`pages/`**: Views corresponding to routes.
-   **Layout:** `components/Layout.jsx` provides the Navbar and Footer.

### 4.4 State Management
-   **Global:** `AuthContext` (User profile, Balance, Auth Status).
-   **Local:** `useState` / `useEffect` within pages for fetching data (e.g., `FundList.jsx` fetches funds).
-   **Data Fetching:** Direct Axios calls via `src/api/index.js`. No generic centralized store (Redux/Zustand) is currently used.

### 4.5 API Communication
-   **Abstraction:** `client/src/api/index.js` exports typed methods (e.g., `authApi.login`, `amcApi.getFunds`).
-   **Interceptors:** Automatically attaches JWT token to requests.

### 4.6 UI & Styling
-   **Framework:** Tailwind CSS.
-   **Design System:** Gradient-heavy, "Glassmorphism" aesthetic (premium financial look).
-   **Responsive:** Mobile-first utilities.

### 4.7 AdSense Integration
-   **Strategy:** Dynamic loading via `AdSense.jsx` component.
-   **Control:** Regulated by `VITE_isAdsEnabled` (Boolean) in `client/.env`.
-   **Privacy/Performance:** Scripts are **NOT** loaded if disabled. No empty placeholders are rendered in production or development when disabled.

---

## 5. Core Data Models

-   **Fund**: `{ scheme_code, scheme_name, fund_house, scheme_category, is_active }`
-   **Transaction**: `{ id, user_id, scheme_code, amount, units, type (SIP/SWP), status (PENDING/SUCCESS), next_execution_date }`
-   **Holding**: `{ user_id, scheme_code, total_units, invested_amount, current_value }`

---

## 6. Critical Business Workflows

### 6.1 Fund Ingestion (Nightly)
1.  **Trigger:** Cron (`0 1 * * *`) or Manual Admin Action.
2.  **Action:** `mfapiIngestionService.runFullSync()`.
3.  **Fetch:** Calls MFAPI `/mf/latest`.
4.  **Filter:** Applies Whitelist & Exclusion Keywords (No IDCW).
5.  **Upsert:** Updates `funds` table and `fund_nav_history`.
6.  **Enrich:** (Optional) Lazy-load extra data if `detail_info_synced_at` is old.

### 6.2 SIP Execution (Daily)
1.  **Trigger:** Cron (`0 6 * * *`) -> `scheduler.service.executeDueTransactions()`.
2.  **Query:** `transactions` table for `status='SUCCESS'` (recurring) or `PENDING` where `next_execution_date <= Today`.
3.  **Execute:**
    -   Fetch NAV from `fund_nav_history`.
    -   Deduct `amount` from `demo_accounts.balance`.
    -   Add `units` (amount / NAV) to `holdings`.
    -   Log to `execution_logs`.
    -   Update transaction `last_execution_date` & `next_execution_date`.

---

## 7. Cross-Cutting Concerns

-   **Security:** Hashed passwords (`bcrypt`), JWT Auth, Helmet headers.
-   **Performance:** `mysql2` connection pooling. API caching (memory) for frequent lookups (AMCs).
-   **Scalability:** Monolith structure; scalable via vertical scaling primarily. DB is the bottleneck.

---

## 8. Known Constraints & Assumptions

-   **Data Delay:** NAVs are 1 day delayed (EOD data from AMFI/MFAPI). Real-time trading is NOT supported.
-   **Local Truth:** The app assumes the local DB is the "source of truth" for the UI. If sync fails, the UI shows stale data. It does not fallback to live API calls from the client.
-   **Docker Host:** The code assumes availability of `mysql` hostname. Local dev outside Docker requires `.env` override to `localhost`.

---

## 9. Safe Change Guidelines (VERY IMPORTANT)

### Risk Verification
-   **Database Changes:** If modifying `schema.sql`, you **MUST** check compatible changes with `knex` or manual migration scripts. The system currently uses `init-db.sql` which only runs on fresh install. **Schema changes on live systems require manual intervention.**
-   **Sync Logic:** Modifying `mfapiIngestionService.js` carries high risk of data corruption or duplicate funds. **Always test filtering logic on a subset.**

### Dependency Chain
1.  **Models** (`src/models/`) are foundational. Change them first.
2.  **Services** (`src/services/`) depend on Models.
3.  **Controllers** depend on Services.
4.  **Frontend** depends on Controller API responses.

### Testing Expectations
-   **Backend:** Write unit tests for Services (especially Scheduler math).
-   **Frontend:** Verify Mobile View for tables (overflow issues are common).

---

## 10. AI Change Contract

Before modifying or adding functionality, you MUST:

1.  **Re-read this ARCHITECTURE.md**.
2.  **Identify Impact:** Check if the change affects the "Sync -> Scheduler -> UI" data flow.
3.  **Preserve Contracts:** Do not rename JSON response fields (`schemeCode`, `nav`) used by the Frontend.
4.  **Verify Environment:** Check `docker-compose.yml` if adding new services or ports.
5.  **Check Whitelists:** If adding a new Mutual Fund, verify it passes `AMC_WHITELIST` and `EXCLUDED_KEYWORDS` in `mfapiIngestion.service.js`.

If unsure — ask clarifying questions instead of guessing.

---

## 11. Recent Changes (January 2026)

### 11.1 Backend Fixes

#### Date Utilities (IST Timezone)
-   **New File:** `src/utils/date.utils.js`
-   **Functions:** `getISTDate()`, `getISTTime()`, `toISTDateString()`
-   **Purpose:** Ensures all business logic uses IST (Asia/Kolkata) timezone instead of UTC, fixing timezone-related double execution bugs.
-   **Policy:** **ALWAYS** use `toISTDateString(date)` for DB storage. **NEVER** use `date.toISOString().split('T')[0]` because it converts local IST midnight to previous day UTC (rollback error).
-   **Used By:** `scheduler.service.js`, `demo.service.js`

#### Relaxed NAV Date Filter
-   **File:** `src/services/mfapiIngestion.service.js`
-   **Change:** `filterByCurrentMonth()` now uses a **45-day rolling window** instead of strict current-month check.
-   **Benefit:** Fixes "Full Fund Sync" rejection of valid NAV data at month boundaries (e.g., Jan 31st data rejected on Feb 1st).

#### Incremental Fund Sync Enabled
-   **File:** `src/jobs/scheduler.job.js`
-   **Change:** Uncommented `Incremental Fund Sync` registration.
-   **Schedule:** Runs at 10 AM, 12 PM, 2 PM IST for fresher NAV data.

#### Log Persistence
-   **File:** `docker-compose.yml`
-   **Change:** Added `volumes: - ./logs:/app/logs` to backend service.
-   **Benefit:** Logs survive container restarts.

### 11.2 New Features

#### Report Issue Feature
-   **Backend:**
    -   `src/services/email.service.js`: Added `sendSupportTicket()` method.
    -   `src/routes/support.routes.js`: New route `POST /api/support/report` (requires auth).
    -   Registered in `src/app.js`.
-   **Frontend:**
    -   `client/src/pages/ReportIssue.jsx`: New page for submitting bug reports/feedback.
    -   Route: `/report-issue` (protected).

### 11.3 UI/UX Enhancements

#### Navigation Tabs
-   **File:** `client/src/components/Layout.jsx`
-   **Changes:**
    -   "Asset Managements" → "Mutual Funds"
    -   "Investment Calculator" → "Calculators"
    -   Mobile: "Inv. Calc" → "Calc"
    -   **CTA Cleanup:** Removed the "Start Practice Account" hero button to streamline the landing page experience.

#### Calculator Input Flexibility
-   **Files:** All `client/src/components/calculators/*.jsx` (20 files)
-   **Change:** `step="500"`, `step="1000"`, etc. → `step="any"` for flexible input values.

#### Signup Page Enhancements
-   **File:** `client/src/pages/Register.jsx`
-   **New Features:**
    -   **Password Strength Meter:** Visual bar (red/yellow/green) with strength label.
    -   **Market-Synced Simulation Badge:** Blue shield badge in left panel.
    -   **Real Market Data Badge:** Green badge for 12 AMCs.
    -   **Mobile Value Banner:** Gradient banner visible on mobile showing demo balance info.
    -   **Content Expansion (Left Panel):** Replaced list with a **Bento Grid layout** featuring a "Master the Markets" hero card, "Gain Deep Insights" feature grid, and social proof footer.

#### Systematic Plans & Portfolio UI
-   **File:** `client/src/pages/Portfolio.jsx`
-   **Changes:**
    -   **Grid Layout:** Updated Systematic Plans card to **5 columns** (was 4).
    -   **New Column:** Added **"Next Installment" / "Next Receivable"** showing `next_execution_date`.
    -   **Feedback Button:** Added visible "Feedback" button to header (Desktop: Button, Mobile: Icon).
    -   **Global Navigation:** "Feedback" button moved to Main Header for better accessibility.

#### Fund Details Page
-   **File:** `client/src/pages/FundDetails.jsx`
-   **Change:**
    -   **Conditional NAV History:** The "Recent NAV History" card is now completely hidden if no historical data is available, causing the layout to shift up cleaner.

### 12.4 Backend Improvements
#### Email Service
-   **File:** `src/services/email.service.js`
-   **Enhancement:**
    -   **HTML Formatting:** `sendSupportTicket` now preserves newlines in user descriptions by converting `\n` to `<br>`, improving readability of support tickets.

### 12.5 AdSense Implementation
-   **File:** `client/src/components/AdSense.jsx`
-   **Enhancement:**
    -   **Strict Visibility Control:** Introduced `VITE_isAdsEnabled` to toggle ads globally.
    -   **Dev Placeholders:** In development mode (`npm run dev`), ads render as **visible grey placeholders** to verify layout/spacing without loading real scripts.
    -   **Zero-Footprint:** When disabled, the component renders `null` and injects **zero** scripts.
    -   **Architecture:** Removed hardcoded script from `index.html` in favor of dynamic React hook injection.

### 11.4 UI Consistency & Ad Placement (February 2026)
#### Feedback Page Styling
-   **File:** `client/src/pages/ReportIssue.jsx`
-   **Change:**
    -   **Global Background:** Removed local `bg-gray-50` to allow the main application textured background to show through.
    -   **Glassmorphism:** Applied `bg-white/80 backdrop-blur-md` to the form card for readability and consistency with the "Premium" design language.

#### Portfolio Ad Inventory
-   **File:** `client/src/pages/Portfolio.jsx`
-   **Change:** Added a second **Banner Ad** unit at the bottom of the page content to maximize visibility without disrupting the user flow.

### 12.6 Production Hardening & Admin Infrastructure (Late Jan 2026)

#### Database Resilience
-   **File:** `src/db/database.js`
-   **Enhancement:**
    -   **Retry Logic:** Implemented robust retry mechanism for `ECONNREFUSED` and `ETIMEDOUT` errors.
    -   **Startup Stability:** Prevents application crash when the database container is slower to start than the backend service (Race Condition).

#### Admin Dashboard Overhaul
-   **New Components:** `LogViewer`, `SchedulerStats`, `SyncActivityChart`, `UserManagement`.
-   **Features:**
    -   **Visual Stats:** Charts for fund sync status and scheduler activity.
    -   **Log Management:** Interactive log viewer with support for native browser downloads.
    -   **Security:** JWT-protected log downloads using query parameter authentication (token in URL).
    -   **Safety:** Hardened `API_URL` handling in all admin components to prevent `undefined` string pollution in request paths.


### 11.7 Critical Fixes (February 2026)

#### Timezone Logic & Double Execution Fix
-   **Files:** `src/utils/date.utils.js`, `src/services/scheduler.service.js`, `src/services/demo.service.js`.
-   **Problem:** System was using UTC dates (`new Date().toISOString()`), causing SIPs created near midnight IST to execute twice (once for "Yesterday UTC" and once for "Today IST").
-   **Solution:**
    -   **Strict IST Truth:** Implemented `getISTDate()` utility.
    -   **Refactor:** All transaction scheduling and metadata (`lastExecutionDate`, `executionCount`) now strictly uses IST dates.
    -   **Validation:** Verified correct day rollover at Jan 31st and Feb 28th boundaries.

#### Sync Logic Optimization
-   **Files:** `src/services/mfapiIngestion.service.js`, `docker-compose.yml`.
-   **Change:**
    -   **Incremental Sync Activated:** Enabled `ENABLE_INCREMENTAL_SYNC` in configuration.
    -   **Rolling Window Filter:** Updated sync logic to use a 45-day rolling window (`filterByRecentNav`) instead of strict current-month checks, preventing data rejection at month boundaries.

#### Logging & Observability Upgrade (Feb 2026)
-   **Files:** `src/services/scheduler.service.js`, `src/services/demo.service.js`, `src/services/mfapiIngestion.service.js`.
-   **Problem:** Critical backend services were using `console.log()`, which only writes to ephemeral Docker output, not to the file-based log system accessible via Admin Dashboard.
-   **Solution:**
    -   **Logger Import:** All 3 services now import `logger.service.js`.
    -   **Replacement:** ~50 `console.log/error/warn` calls replaced with `logger.info/error/warn`.
    -   **Outcome:** Scheduler events, transaction executions, and sync jobs are now visible in `logs/application-YYYY-MM-DD.log`.

#### SWP Weekly Frequency Support (Feb 2026)
    -   **Solution:** Updated validation logic to allow `WEEKLY` frequency for SWP transactions.

#### Admin Log ZIP Download (Feb 2026)
-   **Files:** `src/controllers/log.controller.js`, `src/routes/admin.routes.js`, `client/src/components/admin/LogViewer.jsx`.
-   **Dependency:** Added `adm-zip` for in-memory ZIP creation.
-   **Feature:** Admins can now click "Download All" in the System Logs card to download all log files as a single `system-logs-YYYY-MM-DD.zip` archive.
-   **API:** `GET /api/admin/logs/download-all` (JWT protected).

### 11.8 UI Refinements & Documentation (Feb 2026)
#### Global Application Background
-   **Files:** `client/src/components/Layout.jsx`, `client/src/pages/Login.jsx`, `client/src/pages/Register.jsx`.
-   **Change:** Updated to use `background.png` with `cover` and `fixed` properties for a consistent visual theme.

#### Component Removal & Cleanup
-   **Components Removed:**
    -   `AMCMarquee.jsx`: Removed from `Landing.jsx`, `Login.jsx`, and `Register.jsx` to reduce visual clutter.
    -   `MarketMasteryBanner.jsx`: Removed from `AmcList.jsx` and `Calculator.jsx` as part of the "Pro Fintech" aesthetic streamlining.
-   **Header Text Removal:** Removed secondary marquee header "Access Funds From India's Top Houses" to simplify the interface.

#### Market Ticker Removal (Feb 2026)
-   **Files Removed:** `client/src/components/login-enhancements/MarketTicker.jsx`.
-   **Usages Removed:** `Landing.jsx`, `Login.jsx`, `Register.jsx`, `Calculator.jsx`, `AmcList.jsx`.
-   **Reason:** Feature deprecated as part of UI streamlining.

#### Calculator UI (Feb 2026)
-   **File:** `client/src/pages/Calculator.jsx`.
-   **Status:** Reverted to original white theme with emerald accents.
-   **Design:** Clean white cards (`bg-white`), gray text (`text-gray-900`), and standard shadows.


## 13. Notification System

### 13.1 Architecture Overview
The notification system has **three distinct components** working together to deliver a seamless user experience:

| Component | Location | Purpose | Trigger |
|-----------|----------|---------|---------|
| `InvestmentPerformanceNotification` | Portfolio.jsx | Portfolio update popup (first on login) | `showLoginNotification` session flag |
| `LoginAlerts` | Portfolio.jsx | Sequential SIP/SWP notification popups | After performance popup dismissed |
| `NotificationCenter` | Layout.jsx | Bell icon + dropdown (always visible) | User clicks bell icon |

### 13.2 Component Details

#### InvestmentPerformanceNotification.jsx
-   **Type:** One-time login popup
-   **Content:** Shows portfolio performance ("Your investment grew by X%") or welcome message for new users
-   **Trigger:** `sessionStorage.showLoginNotification === 'true'`
-   **Data Source:** `portfolioSummary` from `AuthContext`

#### LoginAlerts.jsx
-   **Type:** Sequential popup queue
-   **Content:** SIP/SWP success/error notifications from database
-   **Props:** `showAfterPerformance` - Controls when to start showing alerts
-   **Behavior:**
    1. Waits for `InvestmentPerformanceNotification` to be dismissed
    2. Fetches unread notifications from `GET /api/notifications`
    3. Shows oldest notification first
    4. "OK, Next →" button advances to next notification
    5. Marks each as read when dismissed
-   **Data Source:** `user_notifications` table (DB)

#### NotificationCenter.jsx
-   **Type:** Persistent bell icon with dropdown
-   **Location:** App header (desktop + mobile)
-   **Behavior:**
    1. Polls `GET /api/notifications` every 60 seconds
    2. Shows unread count badge on bell icon
    3. Dropdown lists all unread notifications
    4. User can dismiss individual notifications or "Mark all read"
-   **Data Source:** `user_notifications` table (DB)

### 13.3 Login Popup Flow (Sequential)

```
User Logs In
    │
    ▼
┌─────────────────────────────────────┐
│ InvestmentPerformanceNotification   │  ← Shows FIRST
│ "Your portfolio grew by ₹X,XXX"     │
│ [OK, Got It!]                       │
└─────────────────────────────────────┘
    │ User clicks OK
    ▼
┌─────────────────────────────────────┐
│ LoginAlerts - Notification #1       │  ← Shows SECOND
│ "SIP Success: Wealth Builder Alert" │
│ [OK, Next →]                        │
└─────────────────────────────────────┘
    │ User clicks OK, Next →
    ▼
┌─────────────────────────────────────┐
│ LoginAlerts - Notification #2       │  ← Shows THIRD
│ "SWP Success: Passive Income Alert" │
│ [Awesome!]                          │
└─────────────────────────────────────┘
    │ User clicks Awesome!
    ▼
Done - All notifications dismissed
```

### 13.4 Data Model (user_notifications)
```sql
CREATE TABLE user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,       -- Hard-linked to user (privacy)
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',  -- INFO, SUCCESS, ERROR
    is_read BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 13.5 Privacy & Isolation
**Question:** If User A has a SIP and User B has an SWP on the same day, do they see each other's alerts?
**Answer:** **NO.**

1.  **Execution:** The Scheduler creates distinct notification records:
    -   Record 1: `{ user_id: A, message: "SIP Success" }`
    -   Record 2: `{ user_id: B, message: "SWP Success" }`
2.  **Login:**
    -   User A logs in → Token ID is A → API checks `WHERE user_id = A` → Returns only Record 1.
    -   User B logs in → Token ID is B → API checks `WHERE user_id = B` → Returns only Record 2.

**Outcome:** Zero cross-talk. Complete privacy.

### 13.6 Backend API
-   **GET /api/notifications** - Fetch unread notifications for authenticated user
    -   Headers: `Cache-Control: no-store` (prevents 304 caching)
    -   Response: `{ success: true, count: N, data: [...] }`
-   **PUT /api/notifications/:id/read** - Mark single notification as read
-   **PUT /api/notifications/read-all** - Mark all notifications as read

### 13.7 Testing Notifications
Manual trigger script for testing:
```bash
# Run Locally
node scripts/trigger_test_notifications.js

# Run in Docker
docker compose exec backend node scripts/trigger_test_notifications.js
```

---

### 11.5 Landing Page Enhancements (February 2026)
#### Dynamic Content Components
-   **File:** `client/src/pages/Landing.jsx`
-   **New Features:**
    -   **Market Ticker:** Real-time scrolling ticker showing indices (NIFTY 50, SENSEX) at the very top.
    -   **AMC Marquee:** Infinite scroll marquee showing logos of top AMCs (SBI, HDFC, ICICI, etc.) below the hero section.
    -   **Ads Integration:** Seamlessly integrated `BannerAd` and `DisplayAd` components into the layout.

### 11.6 Component Cleanup
-   **Removed:** `SIPTeaser` and `FAQSection` were removed from Login/Register pages to maintain a cleaner, less clutter "Pro Fintech" aesthetic.

## 14. Session & Security Management

### 14.1 Authentication Architecture
-   **Method:** Stateless JWT (JSON Web Token) using `HS256`.
-   **Token Storage:** Client-side `sessionStorage`.
    -   **Behavior:** Token persists across page reloads but is **destroyed** when the browser/tab is closed.
    -   **Auto-Logout:** Closing the browser acts as a hard logout.

### 14.2 Idle Timeout Policy
-   **Implementation:** `client/src/hooks/useIdleTimer.js`.
-   **Duration:** **2 Minutes** (Hard Logout).
-   **Warning:** At **1 Minute**, a "Session Timeout" modal warns the user.
-   **Activity Tracking:** Monitors Mouse Move, Click, Scroll, Keydown.
-   **Enforcement:** `IdleContext` forces a redirect to `/login` upon timeout.

### 14.3 Security Alerts
-   **Login Alerts:** (`LoginAlerts.jsx`)
    -   Checks for critical system events (e.g., SIP Failed) that occurred while offline.
    -   Displayed immediately upon login.
-   **Privacy:** Alerts are fetched based on `userId` extracted from the JWT, ensuring users never see each other's notifications.

---

## 15. February 2026 Bug Fixes

### 15.1 Scheduler `last_nav_date` Truncation Fix

#### Problem
The `holdings` table column `last_nav_date` is defined as `VARCHAR(10)`, but the scheduler was storing full ISO timestamps (29 characters), causing transaction failures:
```
[Scheduler] Transaction 3 failed: Data too long for column 'last_nav_date' at row 1
```

#### Root Cause
**File:** `src/services/scheduler.service.js`
| Line | Original Code | Issue |
|------|---------------|-------|
| 449 | `new Date().toISOString()` | ❌ Returns `2026-02-02T00:30:00.764Z` (29 chars) |
| 376 | `new Date().toISOString().split('T')[0]` | ⚠️ Works but inconsistent with IST policy |
| 388 | `new Date().toISOString().split('T')[0]` | ⚠️ Works but inconsistent with IST policy |

#### Solution
Replaced all occurrences with `getISTDate()` from `src/utils/date.utils.js`:
```javascript
// Before (Line 449 - CRITICAL BUG)
await holdingModel.updateCurrentValue(userId, schemeCode, nav, new Date().toISOString());

// After
await holdingModel.updateCurrentValue(userId, schemeCode, nav, getISTDate());
```

#### Files Modified
- `src/services/scheduler.service.js` (Lines 376, 388, 449)

#### Policy Reminder
> **NEVER** use `new Date().toISOString()` for date storage.  
> **ALWAYS** use `getISTDate()` or `toISTDateString()` from `date.utils.js`.

---

### 15.2 Fund Returns (CAGR) Formatting Fix

#### Problem
The Fund Details page displayed CAGR returns without consistent decimal formatting (e.g., `8%` instead of `8.00%`).

#### Solution
**File:** `client/src/pages/FundDetails.jsx` (Lines 531, 535, 539)

Applied `parseFloat().toFixed(2)` and changed truthy check to `!= null` (so `0%` displays correctly):

```jsx
// Before
{meta?.returns_1y ? `${meta.returns_1y}%` : 'N/A'}

// After
{meta?.returns_1y != null ? `${parseFloat(meta.returns_1y).toFixed(2)}%` : 'N/A'}
```

#### Affected Metrics
- 1 Year Returns
- 3 Year Returns
- 5 Year Returns

---

### 15.3 Notification Debugging

#### Manual Trigger Script
A new script `scripts/trigger_test_notifications.js` has been added to manually push test notifications to the admin user.

**Usage:**
```bash
# Run inside Docker
docker compose exec backend node scripts/trigger_test_notifications.js

# Run Locally
$env:DB_HOST="127.0.0.1"; node scripts/trigger_test_notifications.js
```

**Functionality:**
1. Connects to the database.
2. Finds the first user with `role='admin'` (or matching 'admin' email).
3. Inserts two "SUCCESS" notifications (SIP & SWP) into `user_notifications`.
4. These immediately appear in the UI Notification Center.
