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

### 11.4 Backend Improvements
#### Email Service
-   **File:** `src/services/email.service.js`
-   **Enhancement:**
    -   **HTML Formatting:** `sendSupportTicket` now preserves newlines in user descriptions by converting `\n` to `<br>`, improving readability of support tickets.

### 11.5 AdSense Implementation
-   **File:** `client/src/components/AdSense.jsx`
-   **Enhancement:**
    -   **Strict Visibility Control:** Introduced `VITE_isAdsEnabled` to toggle ads globally.
    -   **Zero-Footprint:** When disabled, the component renders `null` and injects **zero** scripts.
    -   **Architecture:** Removed hardcoded script from `index.html` in favor of dynamic React hook injection.

### 11.6 Production Hardening & Admin Infrastructure (Late Jan 2026)

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
-   **File:** `src/services/demo.service.js`.
-   **Problem:** SWP creation was restricted to MONTHLY or QUARTERLY only. Users could not create weekly withdrawals.
-   **Solution:** Updated validation logic to allow `WEEKLY` frequency for SWP transactions.

#### Admin Log ZIP Download (Feb 2026)
-   **Files:** `src/controllers/log.controller.js`, `src/routes/admin.routes.js`, `client/src/components/admin/LogViewer.jsx`.
-   **Dependency:** Added `adm-zip` for in-memory ZIP creation.
-   **Feature:** Admins can now click "Download All" in the System Logs card to download all log files as a single `system-logs-YYYY-MM-DD.zip` archive.
-   **API:** `GET /api/admin/logs/download-all` (JWT protected).
