# Logging System Architecture & Walkthrough

We have successfully implemented a centralized logging system that captures backend events, request/response lifecycles, and critical frontend errors. Admin users can now view and download these logs directly from the dashboard.

## System Overview

| Component | Responsibility | Location |
|-----------|----------------|----------|
| **Logger Service** | Centralized Winston configuration (Console + Daily File Rotation) | `src/services/logger.service.js` |
| **Request Middleware** | Attaches Request IDs and logs HTTP access | `src/middleware/requestLogger.middleware.js` |
| **Log Controller** | API for Admin access and Client ingestion | `src/controllers/log.controller.js` |
| **Frontend Logger** | Utility for client-side logging & error syncing | `client/src/utils/logger.js` |
| **Admin UI** | Log Viewer component to download log files | `client/src/components/admin/LogViewer.jsx` |

## Architecture Decisions

### 1. Storage Strategy
- **File-Based**: Logs are stored in the `/logs` directory at the project root.
- **Rotation**: `winston-daily-rotate-file` manages rotation.
  - **Frequency**: Daily (`YYYY-MM-DD`).
  - **Retention**: **7 Days** (files older than 7 days are auto-deleted).
  - **Format**: JSON (for easy parsing) in production/files, Colorized Text in Console.
- **Separation**:
  - `application-%DATE%.log`: Contains `info`, `warn`, and `error` levels.
  - `error-%DATE%.log`: Contains ONLY `error` level for quick debugging.

### 2. Request Tracing
- **Request ID**: A UUID is generated for *every* incoming request in `requestLogger.middleware.js`.
- **Propagation**: This ID is attached to `req.requestId` and sent back in the `X-Request-ID` response header.
- **Correlation**: All log entries (info, error, db queries) triggered during that request cycle include this `requestId`, allowing full trace reconstruction.

### 3. Frontend Error Ingestion
- **Client-Side Errors**: Critical persistence errors or UI crashes are captured by `FrontendLogger`.
- **Ingestion Route**: `POST /api/logs/client` accepts these errors and logs them to the backend file system with `source: 'frontend'` tag.

## Verification Results

### Backend Verification
Ran `scripts/verify-logging.js`:
1.  **Request Logging**: Health check (`GET /api/health`) was logged with a unique `requestId`.
2.  **Error Logging**: A simulated 404 error was correctly captured in the log file.
3.  **File Creation**: Logs are successfully written to `logs/application-Date.log`.
4.  **Rotation**: Daily rotation is configured for 7 days retention.

```text
3️⃣  Verifying Log Files...
   📂 Found files: ['application-2026-01-30.log', ...]
4️⃣  Verifying Log Content...
   ✅ Found Health Check log entry.
   ✅ Found 404 Error log entry.
   ✅ Request ID found in logs.
🎉 Verification Successful!
```

## How to Use

### 1. Backend Usage
Use the imported logger instead of `console.log`:

```javascript
import logger from '../services/logger.service.js';

// Info (goes to application.log)
logger.info('Processing payment', { userId: 123, amount: 5000 });

// Error (goes to error.log AND application.log)
logger.error('Payment failed', { userId: 123, error: err.message });
```

### 2. Frontend Usage
Use the utility logger:

```javascript
import { logger } from '../utils/logger';

// Info (Console only in dev)
logger.info('Component mounted');

// Error (Sent to Backend in Prod)
logger.error('Critical UI Crash', error);
```

### 3. Viewing Logs
1.  Login as **Admin**.
2.  Navigate to **Dashboard**.
3.  Click the **"Logs"** tab.
4.  Download the desired day's log file.
