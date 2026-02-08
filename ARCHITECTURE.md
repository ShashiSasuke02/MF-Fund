# Project Architecture & Codebase Reference

## 1. High-Level Overview

**Project Name:** MF-Investments (MF Selection App)
**Purpose:** A full-stack paper-trading platform for Indian Mutual Funds. It filters data from 12 major AMCs, allows users to simulate investments (SIP, SWP, STP, Lump Sum), and track portfolio performance using a virtual demo account.
**Deployment Model:** Dockerized Monolith. The React frontend is built and served via the Node.js Express backend in production. Designed for **TrueNAS SCALE** deployment as a Custom App.

### Technology Stack
-   **Frontend:** React 18 (Vite), Tailwind CSS, React Router v6, Recharts.
-   **Backend:** Node.js, Express.js.
-   **Database:** MySQL 8.0 (with `mysql2` connection pool).
-   **Cache:** Redis 7 (with `ioredis`) - High-speed in-memory caching with MySQL fallback.
-   **Infrastructure:** Docker Compose, Nginx (optional proxy), Node Cron.
-   **External APIs:** 
    -   `api.mfapi.in` (Primary Data Source for Indian Mutual Funds).
    -   `portal.amfiindia.com` (Official AMFI NAV Text File for bulk sync).
    -   "Captain Nemo" Integration (Enrichment Service for AUM/Outcome data).

---

## 2. Repository Structure

```
├── client/                 # React Frontend application
│   ├── src/
│   │   ├── api/            # API abstraction layer (Axios instances)
│   │   ├── components/     # Reusable UI components (Layout, Loaders, Ads, SEO)
│   │   ├── contexts/       # Global State (AuthContext, IdleContext)
│   │   ├── pages/          # Route Views (FundList, Portfolio, Admin)
│   │   └── main.jsx        # Entry point with HelmetProvider
│   ├── vite.config.js      # Build configuration (PWA ready)
│   └── .env                # FRONTEND Config (Vite, AdSense)
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
│   ├── mysql.Dockerfile    # Custom DB image (baked SQL for permission safety)
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
-   **`settings.service.js`**: Manages dynamic system configuration (e.g., AI toggles) with in-memory caching.

### 3.4 Data Access Layer
-   **Pattern:** Repository/DAO Pattern (no full ORM).
-   **Location:** `src/models/*.model.js`.
-   **Implementation:** Raw SQL queries via `mysql2` pool.
-   **Wrapper (`src/db/database.js`):** The application checks out a connection pool but wraps it in a custom helper object.
    -   `query(sql, params)`: Returns `rows` array directly (simplifies `[rows, fields]` destructuring).
    -   `run(sql, params)`: Returns object `{ insertId, changes }` for INSERT/UPDATE operations.
    -   **Important:** Do NOT use `pool.execute` or `pool.query` expecting standard MySQL2 return signatures. Use the wrapper methods.
-   **Consistency:** Models perform database writes. Services coordinate complex flows involving multiple models.

### 3.5 Database Schema
(Defined in `src/db/schema.sql`)
-   **`funds`**: Master list of schemes (Scheme Code is PK). Enriched with AUM/Expense Ratio.
-   **`fund_nav_history`**: Time-series data for NAVs. Unique key: `(scheme_code, nav_date)`.
-   **`users` / `demo_accounts`**: User data and virtual wallet balance.
-   **`transactions`**: High-fidelity log of every Buy/Sell order.
-   **`holdings`**: Aggregate snapshot of user's portfolio.
-   **`amc_master`**: Whitelist configuration.
-   **`system_settings`**: Key-value store for global app configuration (AI config, Feature flags).

### 3.6 Authentication & Authorization
-   **Strategy:** JWT (JSON Web Tokens).
-   **Flow:** Login -> Server signs JWT -> Client stores in SessionStorage -> Client sends `Authorization: Bearer <token>`.
-   **Middleware:** `src/middleware/auth.middleware.js` protects routes.
-   **Roles:** Simple 'user' vs 'admin' role column in `users` table.

### 3.7 Error Handling & Logging
-   **Global Handler:** `src/middleware/errorHandler.js` catches async errors and formats them for the client.
-   **Logging:** Centrally managed via `src/services/logger.service.js` (Winston-based).
    -   **Levels:** `info`, `warn`, `error`.
    -   **Persistence:** Writes to `logs/application-YYYY-MM-DD.log` (Rotated daily).
    -   **Policy:** All `console.log` statements are forbidden in production services/controllers.

### 3.8 Configuration
### 3.8 Configuration Architecture
-   **Dual-Config Strategy:**
    1.  **Backend (`/.env`):** Server secrets (`DB_PASSWORD`, `JWT_SECRET`, `PORT`). **NEVER** exposed to client.
    2.  **Frontend (`/client/.env`):** Build-time variables (`VITE_ADSENSE_CLIENT_ID`, `VITE_ADSENSE_ENABLED`). **Visible** in browser bundle.
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
-   **Control:** Regulated by `VITE_ADSENSE_ENABLED` (Boolean) in `client/.env`.
-   **Privacy/Performance:** Scripts are **NOT** loaded if disabled. No empty placeholders are rendered in production.
-   **Dev Mode:** Displays gray placeholders in development to verify layout.

### 4.8 SEO & Rich Snippets
-   **Library:** `react-helmet-async` for head management.
-   **Dynamic Meta:** The `<SEO />` component dynamically updates Page Title, Description, and Keywords.
-   **Structured Data:** Implements **JSON-LD Schema** (`FinancialProduct`) on fund pages for Google Rich Result indexing.
-   **Rich Snippets:** Extracts real-time NAV and Returns for search engine visibility.

---

## 5. Core Data Models

-   **Fund**: `{ scheme_code, scheme_name, fund_house, scheme_category, is_active }`
-   **Transaction**: `{ id, user_id, scheme_code, amount, units, type (SIP/SWP), status (PENDING/SUCCESS), next_execution_date }`
-   **Holding**: `{ user_id, scheme_code, total_units, invested_amount, current_value }`

---

## 6. Critical Business Workflows

### 6.1 Fund Ingestion (Nightly)
**Stage 1: Full Fund Sync** (1:00 AM IST)
1.  **Trigger:** Cron (`0 1 * * *`) or Manual Admin Action.
2.  **Action:** `mfapiIngestionService.runFullSync()`.
3.  **Fetch:** Calls MFAPI `/mf/latest`.
4.  **Filter:** Applies Whitelist & Exclusion Keywords (No IDCW).
5.  **Upsert:** Updates `funds` table and `fund_nav_history`.
6.  **Enrich:** (Optional) Lazy-load extra data if `detail_info_synced_at` is old.

**Stage 2: AMFI NAV Sync** (Automatic, after Stage 1)
1.  **Trigger:**
    -   **Automatic:** Immediately after Full Fund Sync completes (success OR failure).
    -   **Scheduled:** Independently at **11:00 PM IST** and **05:00 AM IST** (`0 5,23 * * *`).
2.  **Action:** `amfiSyncService.runSync()`.
3.  **Fetch:** Downloads AMFI text file (`https://portal.amfiindia.com/spages/NAVAll.txt`).
4.  **Parse:** Semicolon-delimited, ~13,000 records, parses DD-MMM-YYYY dates.
5.  **Match:** Filters to only active funds in database (~5,000 funds).
6.  **Upsert:** Bulk updates `fund_nav_history` with latest NAVs.
7.  **Performance:** ~1.6 MB download, ~1 second parse, ~500ms DB update.

**Manual Jobs (Admin Dashboard Only):**
-   **AMFI NAV Sync:** Fast text-based NAV update (recommended).
-   **Incremental Fund Sync:** Legacy API-based sync (deprecated, slower).

### 6.2 SIP Execution (Daily)
1.  **Trigger:** Cron (`0 6 * * *`) -> `scheduler.service.executeDueTransactions()`.
2.  **Query:** `transactions` table for `status='SUCCESS'` (recurring) or `PENDING` where `next_execution_date <= Today`.
3.  **Execute:**
    -   Fetch NAV from `fund_nav_history`.
    -   Deduct `amount` from `demo_accounts.balance`.
    -   Add `units` (amount / NAV) to `holdings`.
    -   Log to `execution_logs`.
    -   Update transaction `last_execution_date` & `next_execution_date`.

### 6.3 Peer Fund Fallback Logic (Feb 2026)
1.  **Purpose:** Enrich "Regular Plan" funds with data (AUM, Risk, Manager) from their "Direct Plan" counterparts when external enrichment is unavailable.
2.  **Trigger:** Occurs during `GET /api/funds/:id` if local metadata is missing/stale and "Captain Nemo" API returns no data.
3.  **Algorithm:**
    -   **Base Name Extraction:** Splits the target scheme name at the first hyphen (` - `) and trims.
    -   **Exact Search:** Queries the database for a fund where `scheme_name` is **exactly** equal to the Base Name.
    -   **Data Merge:** Copies `aum`, `fund_manager`, `risk_level`, and `expense_ratio` from the peer to the target fund.
4.  **Constraint:** The peer must have valid data (`aum > 0`) to be used as a source.

---

## 7. Cross-Cutting Concerns

-   **Security:** Hashed passwords (`bcrypt`), JWT Auth, Helmet headers.
-   **Performance:**
    -   `mysql2` connection pooling for database operations.
    -   **Redis caching** (primary) with MySQL `api_cache` table (fallback).
    -   TTL-based expiration - Redis auto-expires, MySQL cleaned via periodic job.
-   **Caching Strategy:** "Cache Aside" pattern in `cache.service.js`:
    1.  Try Redis (sub-millisecond).
    2.  If miss, check MySQL `api_cache`.
    3.  If miss, fetch from API.
    4.  Write to both Redis (TTL) and MySQL (durability).
-   **Graceful Degradation:** If Redis is unavailable, app continues with MySQL-only caching.
-   **Scalability:** Monolith structure; scalable via vertical scaling primarily. Redis offloads cache load from DB.

---

## 8. Known Constraints & Assumptions

-   **Data Delay:** NAVs are 1 day delayed (EOD data from AMFI/MFAPI). Real-time trading is NOT supported.
-   **Local Truth:** The app assumes the local DB is the "source of truth" for the UI. If sync fails, the UI shows stale data. It does not fallback to live API calls from the client.
-   **Strict Ledger Policy:** Every fund movement (SIP, SWP, Lump Sum) MUST have a corresponding entry in `ledger_entries`. The user's virtual balance is strictly derived from these movements (simulating a bank statement).
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

### 15.12 Zoho Mail Lite Integration (Feb 2026)
- **Transition:** Migrated from Brevo to Zoho Mail Lite as the primary SMTP provider.
- **Service Enhancement:** Updated `EmailService` to support dynamic SSL/TLS selection.
    - **Port 465:** Uses `secure: true` (SSL).
    - **Other Ports:** Uses `secure: false` (TLS/STARTTLS).
- **Security:** Integrated app-specific password support via `.env`.

### 15.13 Weekday-Only Transaction Logic (Strategic shift - Planned)
- **Objective:** Restrict all financial executions (Lump Sum, SIP, SWP) to market working days.
- **Logic:**
    - Weekend orders are held as `PENDING`.
    - Monday scheduler executes deferred weekend transactions.
    - **Cycle Shift:** Future installment dates are calculated from the *Execute Day* (Monday) rather than the original due date (Weekend).
- **Implementation Status:** Plan approved, implementation pending.

### 15.14 Cumulative Maintenance Fixes (Feb 2026)
- **Ledger Book:** Fixed property naming mismatch (`req.user.id` → `req.user.userId`) to restore history visibility.
- **Sync Reliability:** Increased MFAPI timeout from 15s to **60s** to handle large global fund datasets without aborting.
- **Data Robustness:** Implemented fallback scheme category (`'Other'`) in `demo.service.js` to ensure holdings are always visible in filtered Portfolio views.

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
-  #### Incremental Fund Sync Disabled
-   **File:** `src/jobs/scheduler.job.js`
-   **Change:** `Incremental Fund Sync` is now disabled by default (`ENABLE_INCREMENTAL_SYNC: false`).
-   **Reason:** Superseded by the more accurate AMFI NAV Sync which runs immediately after Full Sync.
-   **Note:** Retained in registry for legacy support/manual usage if re-enabled via environment.

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
    -   **Strict Visibility Control:** Introduced `VITE_ADSENSE_ENABLED` to toggle ads globally.
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

### 15.4 Zero Units/NAV Fix

#### Problem
Transactions were appearing in the history with `units` and `nav` as `0.0000`, even though the scheduler logs claimed they were "executed successfully".

#### Root Cause
1.  **`transaction.model.js`**: The `updateExecutionStatus` method was receiving `units` and `nav` but **ignoring** them in the SQL `UPDATE` statement. It only updated the status and dates.
2.  **`scheduler.service.js`**: The execution logic calculated the correct values but passed them to an incomplete model method.

#### Solution
1.  **Model Update**: Modified `transactionModel.updateExecutionStatus` to conditionally update `units` and `nav` columns if valid values are passed.
2.  **Service Update**: Updated `schedulerService` to explicitly propagate the execution results (`units`, `nav`) to the model update call.
3.  **Creation Logic**: Enhanced `transactionModel.create` to support immediate execution recording (`lastExecutionDate`, `executionCount`) for Lump Sums and "Today" SIPs.

#### Files Modified
-   `src/models/transaction.model.js`
-   `src/services/scheduler.service.js`
-   `src/services/demo.service.js` (Cleanup)

---

### 15.5 NAV Display Precision (Feb 2026)

#### Change
Updated NAV display from 4 decimal places to 2 decimal places for better readability.

#### Files Modified
-   `client/src/pages/Portfolio.jsx` (Lines 531, 549)

#### Before/After
```jsx
// Before
₹{parseFloat(holding.invested_nav || 0).toFixed(4)}  // ₹80.1458

// After
₹{parseFloat(holding.invested_nav || 0).toFixed(2)}  // ₹80.15
```

---

### 15.6 Session Timeout Increase (Feb 2026)

#### Change
Increased idle session timeout from **2 minutes** to **4 minutes** for improved user experience.

#### Files Modified
-   `client/src/hooks/useIdleTimer.js`

#### Configuration
| Setting | Old Value | New Value |
|---------|-----------|-----------|
| Idle Timeout | 2 minutes | 4 minutes |
| Warning | 1 minute | 3 minutes |

---

### 15.7 Sync Job Chaining (Feb 2026)

#### Change
After **Full Fund Sync** completes successfully, the system now automatically triggers **Incremental Fund Sync** to ensure NAV data is immediately up-to-date.

#### Files Modified
-   `src/jobs/scheduler.job.js`

#### Flow
```
Full Fund Sync (1:00 AM IST)
    │
    ▼ (On Success)
Incremental Fund Sync (Automatic)
    │
    ▼
Both results logged together
```

---

### 15.8 AI Mutual Fund Manager (Feb 2026)

#### Overview
Integrated an AI-powered assistant using Ollama (local LLM) to help users understand mutual fund concepts, SIPs, SWPs, and investment strategies.

#### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  AiAssistant.jsx (Floating Chat Widget)                 │ │
│  │  - Glassmorphism design                                 │ │
│  │  - Only visible to authenticated users                  │ │
│  │  - Minimize/Expand/Close states                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                  │
│                      aiApi.chat()                             │
│                            ▼                                  │
└─────────────────────────────────────────────────────────────┘
                             │
                     POST /api/ai/chat
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Node.js)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  ai.routes.js → ai.controller.js → ollama.service.js    │ │
│  │  - Auth middleware protects all endpoints               │ │
│  │  - System prompt defines AI behavior                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                  │
│                    HTTP POST /api/chat                        │
│                            ▼                                  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Ollama Server (192.168.1.4:11434)               │
│  - Model: qwen2.5:0.5b                                       │
│  - Self-hosted LLM                                           │
└─────────────────────────────────────────────────────────────┘
```

#### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_ENDPOINT` | `http://192.168.1.4:11434` | Ollama server URL |
| `OLLAMA_MODEL_NAME` | `qwen2.5:0.5b` | Model to use |
| `AI_SYSTEM_PROMPT` | (See service) | AI behavior definition |

#### Files Added/Modified
- `src/services/ollama.service.js`
- `src/services/ai.controller.js`
- `src/routes/ai.routes.js`
- `client/src/components/ai/AiAssistant.jsx`

### 15.9 AI Manager Visibility (Feb 2026)

#### Feature
The AI Manager widget is now conditionally rendered based on a global system setting.

#### Implementation
- **Backend source of Truth:** `system_settings` table (`ai_enabled` key).
- **API:** `GET /api/ai/status` returns `{ success: true, data: { enabled: boolean } }`.
- **Frontend Behavior:**
    - `AiAssistant.jsx` calls status endpoint on mount.
    - If `enabled: false`, the component returns `null` (does not render).
    - If API fails, it defaults to `enabled: true` (graceful degradation) but logs a warning.

### 15.10 Ledger Model Fix (Feb 2026)
#### Problem
`TypeError: Cannot read properties of undefined` in `LedgerModel`.
#### Cause
Incorrect usage of the `src/db/database.js` wrapper. The model attempted to use `execute` (which doesn't exist on the wrapper) and incorrectly destructured the result of `query` (which returns rows directly).
#### Solution
- Refactored `LedgerModel` to use `pool.run` for inserts.
- Removed array destructuring for `pool.query` results.
- **Learnings:** Always check `src/db/database.js` implementation when writing new models.

| File | Type | Purpose |
|------|------|---------|
| `src/services/ollama.service.js` | Modified | AI service with system prompt |
| `src/controllers/ai.controller.js` | New | Chat & status endpoints |
| `src/routes/ai.routes.js` | New | Protected API routes |
| `src/app.js` | Modified | Route registration |
| `client/src/api/index.js` | Modified | Frontend API client |
| `client/src/components/ai/AiAssistant.jsx` | New | Floating chat widget |
| `client/src/components/Layout.jsx` | Modified | Widget integration |

#### Security
- All AI endpoints protected by `authenticateToken` middleware

### 15.9 Admin AI Manager (Feb 2026)

#### Overview
Added administrative control over the AI Assistant, allowing dynamic toggling and model selection without server restarts.

#### Features
-   **Global Toggle:** Enable/Disable AI features system-wide.
-   **Model Selection:** Dropdown list populated dynamically from Ollama API.
-   **Status Indicator:** Real-time check of Ollama server connectivity.

#### Technical Implementation
-   **Database:** New `system_settings` table stores `ai_enabled` (boolean) and `ai_model` (string).
-   **Service:** `settings.service.js` provides cached access (1-minute TTL) to DB settings.
-   **Frontend:** `AiManager.jsx` component in Admin Dashboard. `AiAssistant.jsx` checks status on mount.
-   **Graceful Degradation:** If AI is disabled via Admin, the chat widget automatically hides for all users.

- Message length limited to 2000 characters
- Conversation history limited to 10 messages
- Graceful error handling (503 on AI failure)

#### .env Configuration (Added)
```env
# AI Mutual Fund Manager (Ollama)
OLLAMA_ENDPOINT=http://192.168.1.4:11434
OLLAMA_MODEL_NAME=qwen2.5:0.5b
AI_SYSTEM_PROMPT=You are a specialized AI Mutual Fund Manager... STRICT TOPIC RESTRICTION...
```


---

### 15.11 Infrastructure Hardening & SEO Phase 2 (Feb 2026)

#### Docker & Production Safety
-   **Custom DB Image:** Introduced `docker/mysql.Dockerfile` to resolve "Permission Denied" errors on TrueNAS SCALE. The DB initialization script is now baked into the image with `644` permissions rather than bind-mounted.
-   **Build Context Fix:** Updated `.dockerignore` and `mysql.Dockerfile` to ensure `client/.env` is accessible during build, preventing AdSense configuration from being stripped in production bundles.
-   **Git Safety:** Renamed database Dockerfile to `mysql.Dockerfile` to bypass `.gitignore` patterns and ensure deployment scripts are tracked.

#### Sync Mechanism Improvements
-   **Automatic Chaining:** The daily scheduler now automatically triggers the **AMFI NAV Sync** immediately after the **Full Fund Sync** completes (or is manually triggered). This ensures historical data and latest NAVs are always in sync.
-   **Manual Job UX:** Updated registry to mark "MANUAL_ONLY" jobs as active, and enhanced the Admin Dashboard UI to display "Manual Trigger Only" tags instead of misleading "Disabled" status.

#### SEO Phase 2 Optimization
-   **Dynamic Metadata:** Implemented page-specific `<SEO />` tags for every route.
-   **Fund Precision:** Fund Details pages now feature dynamic `<title>` tags containing the scheme name and the latest NAV price (e.g., "HDFC Top 100 - NAV: ₹95.20").
-   **Rich Result Snippets:** Integrated `FinancialProduct` structured data (JSON-LD) for all mutual funds, optimizing indexing and search result display.

#### Logging Consolidation
-   **100% Migration:** Completed the removal of legacy `console.log` statements across the entire backend (`src/`).
-   **System Audit:** All critical paths (Scheduler, Ingestion, Auth, API) now use the asynchronous `logger.service.js` for centralized file-based observability.

---

## 16. Deployment Procedures (February 2026)
> **Note:** Comprehensive deployment instructions are maintained in **`DEPLOYMENT.md`**.

### 16.1 TrueNAS / Docker Strategy
-   **Image Building:** Multi-stage Dockerfile builds both Frontend (`npm run build`) and Backend.
-   **Orchestration:** `docker-compose.yml` serves as the source of truth for service definition.
-   **Environment:** Production secrets must be injected via `.env` file on the host.

### 16.2 Critical Environment Variables
For successful deployment, the following new variables **MUST** be present in the production `.env` file:
1.  **`OLLAMA_ENDPOINT`**: URL to the AI server (e.g., `http://192.168.1.4:11434`).
2.  **`OLLAMA_MODEL_NAME`**: Specific model tag (e.g., `qwen2.5:0.5b`).
3.  **`ENABLE_INCREMENTAL_SYNC`**: Set to `true` for intraday updates.

### 16.3 Updates & Rollbacks
-   **Update:** `git pull` -> `docker compose up -d --build` (Forces new image creation).
-   **Rollback:** Revert git commit -> Rebuild.

---

### 15.10 AMC Duplicate & Email Notification Fixes (Feb 2026)

#### AMC Duplication Root Cause
-   **Problem:** The `amc_master` table was seeded with **long** fund house names (e.g., "SBI Mutual Fund"), but `mfapiIngestion.service.js` extracts **short** names from MFAPI (e.g., "SBI"). This caused duplicate entries (one from seed, one from sync).
-   **Solution:**
    -   **File:** `src/db/schema.sql`
    -   **Change:** Updated seed data to use **short names** matching the `AMC_WHITELIST` constant.
    -   **Example:** `'SBI Mutual Fund'` → `'SBI'` (with `display_name` keeping the full name for UI).
-   **Note for Existing Deployments:** Run `scripts/fix-amc-duplicates.js` to clean up existing duplicates.

#### Email Notification "0 0 0" Stats Fix
-   **Problem:** Cron report emails displayed `0` for all stats (Funds Fetched, NAVs Updated, etc.).
-   **Root Cause:** In `scheduler.job.js`, the Full Fund Sync job returns a **nested** object: `{ fullSync: {...}, incrementalSync: {...} }`. The `cronNotification.service.js` was trying to read flat properties (e.g., `result.totalFetched`) which resulted in `undefined` → defaulting to `0`.
-   **Solution:**
    -   **File:** `src/services/cronNotification.service.js`
    -   **Change:** Updated stats extraction to correctly access `result.fullSync.totalFetched` and `result.incrementalSync.totalFetched`, then sum them.
-   **Verification:** After deploying, manually trigger "Full Fund Sync" from Admin Dashboard and confirm the email report shows correct stats.

### 11.9 Ledger Book Implementation (Feb 2026)

#### Overview
Implemented a **double-entry ledger system** to track all financial movements (investments, redemptions, SIP allocations) with high fidelity. This ensures a complete audit trail for the user's demo account balance.

#### Database Schema
- **Table:** `ledger_entries`
- **Columns:**
    - `id`: Primary Key
    - `user_id`: Foreign Key to `users`
    - `transaction_id`: Foreign Key to `transactions` (Nullable for manual resets)
    - `amount`: Transaction amount
    - `balance_after`: Snapshot of user balance after transaction
    - `type`: `CREDIT` (Deposit/Redemption) or `DEBIT` (Investment)
    - `description`: Human-readable context (e.g., "SIP Execution: HDFC Fund")
    - `created_at`: Timestamp

#### Backend Architecture
- **Model:** `src/models/ledger.model.js` - Handles DB insertions and paginated retrieval.
- **Service:** `src/services/ledger.service.js` - Business logic and centralized logging.
- **Controller:** `src/controllers/ledger.controller.js` - Exposes `GET /api/ledger`.
- **Integration:** 
    - `DemoService` logs ledger entries for **Lump Sum** investments and **Account Resets**.
    - `SchedulerService` logs ledger entries for **SIP** (Debit) and **SWP** (Credit) executions.

#### Frontend Integration
- **Component:** `client/src/components/portfolio/LedgerTable.jsx`.
- **Location:** `Portfolio.jsx` - Replaces the "Investment Report" placeholder.
- **Features:** 
    - responsive table/card layout.
    - Server-side pagination.
    - Real-time balance tracking.

#### Regression Safety
- **No Backfill:** Historical transactions prior to this feature validation were **NOT** backfilled to preserve data integrity. The ledger starts tracking from the moment of deployment.

---

### 15.11 Automated AMFI NAV Sync (Feb 2026)

#### Feature
Automated the **AMFI NAV Sync** to run independently of the Full Fund Sync, ensuring data freshness even if metadata syncs are disabled or fail.

#### Schedule
-   **Trigger 1:** Immediately after `Full Fund Sync` (Chained).
-   **Trigger 2:** Scheduled at **11:00 PM IST** and **05:00 AM IST** (`0 5,23 * * *`).

#### Configuration
-   **New Variable:** `ENABLE_AMFI_SYNC_SCHEDULE` (Default: `true`).
-   To disable the independent schedule: Set `ENABLE_AMFI_SYNC_SCHEDULE=false` in `.env` or `docker-compose.yml`.

#### Files Modified
-   `src/jobs/scheduler.job.js`
-   `docker-compose.yml`
-   `Dockerfile` (Added `TZ=Asia/Kolkata`)

---


