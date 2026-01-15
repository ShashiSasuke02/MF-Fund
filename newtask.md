# MF Selection / TryMutualFunds – Master Context

## Purpose & Scope
- Single-page React client (Vite + Tailwind) backed by Express/MySQL API that simulates mutual fund discovery, demo investing, calculators, and portfolio tracking.
- Backend serves REST endpoints for auth, AMC/fund data, demo portfolio operations, calculators, and health checks; frontend consumes the API and manages JWT sessions.

## High-Level Architecture
```
[Client (React SPA)]
        |
        v
[Express API]
  - Middleware: helmet, cors, morgan, rate-limit, JSON body parsing
  - Routers: /auth, /demo, /amcs, /funds, /calculator, /health
        |
        v
[Controllers -> Services]
  - MFAPI integration (fund data)
  - Calculator service
  - Cache service (api_cache table)
        |
        v
[MySQL]
  - Users, demo_accounts, transactions, holdings, amc_master, api_cache
```

## Backend Runtime
- App setup and middleware live in src/app.js; routes mounted under /api.*
- Server bootstrap, DB init, cache cleanup loop, and graceful shutdown in src/server.js.
- Static client served from client/dist when NODE_ENV=production with SPA fallback.

## Data Model (schema.sql)
- amc_master: curated fund houses with display_name/order and optional logo_url.
- api_cache: cache_key + response_json with fetched_at/expires_at; indexed by expires_at.
- users: full_name, email_id, username (unique), password_hash; created_at/updated_at.
- demo_accounts: one-per-user balance with FK to users; checks ensure positive user_id/balance.
- transactions: SIP/STP/LUMP_SUM/SWP with amount, units, nav, frequency DAILY/WEEKLY/MONTHLY/QUARTERLY, start/end_date, installments, status (PENDING/SUCCESS/FAILED/CANCELLED); FKs to users.
- holdings: per-user scheme snapshot (total_units, invested_amount, current_value, last_nav/date) with unique (user_id, scheme_code) and non-negative checks.

## API Surface (server-side routers)
- Auth (/api/auth): POST register, POST login, GET profile (JWT protected).
- Demo (/api/demo): POST/GET transactions, GET systematic-plans, GET portfolio, GET balance (JWT protected via router.use).
- AMC (/api/amcs): GET all, GET :fundHouse, GET :fundHouse/funds with optional search/category/sort.
- Funds (/api/funds): GET search?q, GET :schemeCode (details), GET :schemeCode/nav, GET :schemeCode/history (startDate/endDate/limit).
- Calculators (/api/calculator): rates, simple/compound interest, loan-basic/loan-advanced, fd-payout/fd-cumulative, rd, ppf, ssa, scss, po-mis/po-rd/po-td, nsc, sip, swp, stp, nps, epf, apy.
- Health (/api/health): GET health; cache stats and cache clear endpoints for ops.

## Auth & Security
- JWT bearer auth middleware validates tokens and attaches decoded user; optionalAuth available for non-failing flows.
- Security layers: helmet CSP, CORS allowlist for localhost dev, 1 MB JSON limit, express-rate-limit on /api with customizable window/max, morgan dev logging (disabled in tests).
- Error handling: centralized handler normalizes axios errors (MFAPI), Zod validation errors, DB errors; 404 handler for /api/*.

## Persistence & Caching
- MySQL connection pool via mysql2/promise; schema auto-applied on startup (initializeDatabase).
- Cache service persists MFAPI responses in api_cache with TTL; clearExpired interval every 30 minutes from server bootstrap; health route exposes stats/clear.

## External Integrations
- MFAPI (mfapi.in) consumed by fund services/controllers; cache layer minimizes repeated calls and handles axios error mapping.

## Frontend Notes
- React 18 + Vite + Tailwind; routing via React Router; AuthContext wraps JWT handling; calculators live under client/src/components/calculators/*; pages include Landing, Invest, Calculator, Fund list/detail, Portfolio, Login/Register.

## Configuration (env expectations)
- Server: PORT (default 4000), NODE_ENV, JWT_SECRET, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS.
- Database: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.
- External API/cache: MFAPI_BASE_URL, MFAPI_TIMEOUT_MS, CACHE_TTL_MS (per docs); adjust cache cleanup interval if needed.

## Validation, Logging, Error Strategy
- Input validation through controller/service-level checks and Zod (errors mapped to 400).
- Logging via morgan (requests) and console logs for DB init/cache cleanup/errors; production should swap to structured logger.
- Error responses shape: { success: false, error/message, details? }.

## Testing & Quality
- Tests documented in tests/README.md with unit coverage for models/services/controllers/middleware and integration API suites; coverage goals >90% overall, 100% on critical paths.
- Frontend tests planned under client/tests with React Testing Library.

## Operational Constraints & Defaults
- Trust proxy enabled for rate limiting behind reverse proxies.
- Body limit 1 MB; CORS credentials enabled for dev origins only; production assumes same-origin serving of client.
- Graceful shutdown handles SIGINT/SIGTERM, closes cache interval and DB pool; hard exit after 10s fallback.
