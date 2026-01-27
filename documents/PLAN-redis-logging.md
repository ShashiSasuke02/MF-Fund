# PLAN: Redis Caching & Global Logging System

## 1. Objective
Improve application performance via Redis caching and implement a comprehensive, exportable logging system for both Frontend and Backend to simplify debugging and analysis.

## 2. Part A: Redis Implementation

### Goal
Cache frequent API responses (MFAPI) and database queries (Fund Details, Search) to reduce latency and external API dependency.

### Technical Strategy
- **Infrastructure:** Add a `redis:alpine` service to `docker-compose.yml`.
- **Backend Integration:** Use `ioredis` for connecting to the cache.
- **Caching Logic:**
  - **Fund Search:** Cache common search queries for 1 hour.
  - **Fund Details:** Cache full fund data for 6 hours (refreshed by daily sync).
  - **MFAPI Proxies:** Cache external API results to avoid rate limits.
  - **Sync Job:** Use Redis as a semaphore to prevent concurrent sync runs.

---

## 3. Part B: Global Logging System

### Goal
Unified logging with log rotation, file exports, and frontend error capturing.

### Technical Strategy (Backend)
- **Tool:** Use `winston` + `winston-daily-rotate-file`.
- **Log Levels:** `error`, `warn`, `info`, `http`, `debug`.
- **Storage:** 
  - `logs/error.log`: Only critical errors.
  - `logs/combined.log`: All activity.
  - **Rotation:** Keep logs for 14 days, max file size 20MB.
- **Exporting:** Create a `GET /api/admin/logs/export` endpoint for admins to download logs as `.zip`.

### Technical Strategy (Frontend)
- **Tool:** Custom `logger.js` utility.
- **Backend Sync:** 
  - Log `error` and `warn` events back to the server via `POST /api/logs/client`.
  - Batch logs every 5 seconds or on window close to minimize network overhead.
- **Context:** Capture UserID, Page URL, Browser Info, and Stack Traces.

---

## 4. Implementation Details

### A. Infrastructure & Dependencies
1.  **Backend Dependencies:** `npm install ioredis winston winston-daily-rotate-file multer`
2.  **Docker:** Update `docker-compose.yml` with Redis service and network.

### B. Core Service Logic
1.  **Cache Service (`cache.service.js`):** Wrapper for get/set/delete with TTL support.
2.  **Logger Service (`logger.service.js`):** Configure Winston transports.
3.  **Middleware:** 
    - `logger.middleware.js`: Replace Morgan with custom Winston-based request logger.
    - `cache.middleware.js`: Simple route caching for search and list endpoints.

### C. Admin API
1.  `GET /api/admin/logs/list`: View last 100 log lines in dashboard.
2.  `POST /api/admin/logs/export`: Generate and stream a zip file of the logs directory.

---

## 5. Verification Plan
- [ ] Verify Redis connectivity via health check.
- [ ] Verify search response time reduction (Target: < 50ms for cached hits).
- [ ] Verify `logs/` directory population and rotation.
- [ ] Trigger a frontend error and verify it appears in `logs/combined.log` with `CLIENT_ERROR` tag.
- [ ] Download logs via admin panel and verify readability.
