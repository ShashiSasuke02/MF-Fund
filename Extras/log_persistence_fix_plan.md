# Implementation Plan: Fix System Log Persistence

## 1. Problem Statement
**Issue:** The "System Logs" section in the Admin Dashboard is often blank or missing historical data (e.g., "yesterday's logs").
**Root Cause:**
*   The application writes logs to `/app/logs` *inside* the Docker container.
*   **Missing Volume:** There is no mapping between the container's log folder and the host machine.
*   **Consequence:** When the container restarts (deployment, crash, or manual restart), the internal file system is reset, and all logs are deleted.

## 2. Solution Specification
**Objective:** Persist log files on the host machine so they survive container restarts.

### 2.1 Backend Change (Docker)
*   **Action:** Add a volume mapping to `docker-compose.yml`.
*   **Mapping:** `./logs:/app/logs`
*   **Benefit:** Logs will appear in a `logs` folder in your project root on the TrueNAS/Server.

### 2.2 Frontend Logs Note
*   **Current Architecture:** The frontend captures errors and sends them to the backend via `POST /api/logs/client`.
*   **Storage:** These errors are written to the **same** log files (`application-YYYY-MM-DD.log` or `error-YYYY-MM-DD.log`) alongside backend logs.
*   **Result:** By fixing the volume, you will automatically preserve both Backend *and* Frontend error logs.

---

## 3. Change Impact Matrix (Tier 0.5)

| Layer | File | Risk | Reason |
| :--- | :--- | :--- | :--- |
| **Infra** | `docker-compose.yml` | **LOW** | Standard volume configuration. |

---

## 4. Implementation Steps

### Step 1: Update `docker-compose.yml`

Locate the `backend` service definition and add the volume:

```yaml
  backend:
    # ... other configs
    volumes:
      - ./logs:/app/logs  # [NEW] Persist logs to host
```

### Step 2: Verification

1.  **Deploy:** Run `docker-compose up -d`.
2.  **Check Host:** Confirm a `logs/` folder is created in the project directory.
3.  **Check Content:** Verify `application-....log` files exist inside.
4.  **Restart Test:** Run `docker-compose restart backend`.
5.  **Verify Persistence:** Check "System Logs" in Dashboard. The previous logs should still be listed.

---

## 5. Rollback Strategy
If the container fails to start (e.g., permission issues with the created folder):
1.  Remove the volume line from `docker-compose.yml`.
2.  Run `docker-compose up -d` to revert.
