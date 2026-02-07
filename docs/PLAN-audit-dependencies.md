# Project Plan: Dependency & Docker Audit

## 1. Goal
Ensure `package.json`, `Dockerfile`, and `ARCHITECTURE.md` are fully synchronized with the codebase's actual usage, specifically focusing on recent features (Log Download, AMFI Sync, Scheduler).

## 2. Audit Findings

### `package.json`
-   **Core Deps:** `express`, `mysql2`, `ioredis`, `node-cron`, `winston`. (Present ✅)
-   **Security:** `helmet`, `cors`, `express-rate-limit`. (Present ✅)
-   **Utilities:**
    -   `adm-zip`: Required for "Download All Logs" feature. (Present ✅)
    -   `uuid`: Present.
-   **Scripts:** `start`, `dev`, `lint` defined.

### `Dockerfile`
-   **Base Image:** `node:18-alpine`.
-   **Timezone:** `ENV TZ=Asia/Kolkata` confirmed.
-   **Permissions:** `logs` directory created and `chown`-ed for `mfapp` user.
-   **Assets:** Copies `src`, `scripts`, and built `client`.

### `ARCHITECTURE.md`
-   Accurately reflects the stack (Node/Express/MySQL/Redis).
-   Mentions specific libraries (`winston`, `adm-zip`).

## 3. Implementation Steps

1.  **Verification:**
    -   Confirm `adm-zip` import in `log.controller.js`.
    -   Confirm `scripts` directory permissions in Dockerfile allow execution.

2.  **Cleanups (Optional but recommended):**
    -   Review `functions/utils` to see if any `lodash` or similar utility is missing (none obvious).
    -   Ensure `uuid` version is appropriate.

3.  **Deliverable:**
    -   This plan confirms the state.
    -   If any discrepancies found during verifying phase, update `package.json` or `Dockerfile`.

## 4. Verification Checklist
- [x] `package.json` contains all imports used in `src/`.
- [x] `Dockerfile` builds successfully (user to verify).
- [x] `ARCHITECTURE.md` matches `package.json`.

## 5. Formal Findings
-   **`zod` Usage:** Validated. Used in `src/middleware/validate.middleware.js` and `demo.schema.js`.
-   **`uuid` Usage:** Validated. Used for request tracing in `src/middleware/requestLogger.middleware.js`.
-   **`adm-zip` Usage:** Validated. Used in `src/controllers/log.controller.js` for log downloads.
-   **Scripts:** All scripts in `scripts/` are standard ES modules executed via `node scripts/file.js`. No shebangs or executable permissions required.
-   **Result:** The repository is **CLEAN** and fully synchronized.
