# Plan: Redis Caching Implementation

## 1. Executive Summary
**Goal:** Replace/Augment the current MySQL-based `api_cache` with **Redis** to significantly reduce latency for fund sync operations and potentially cache frequent API responses (Funds, NAVs).

**Why Redis?**
-   **Speed:** In-memory key-value store (<1ms response) vs Disk/DB I/O.
-   **Throughput:** Handles high R/W operations during "Full Fund Sync".
-   **Expiration:** Native TTL support (no need for manual cleanup jobs).

## 2. Architecture Changes

### 2.1 Infrastructure (Docker)
-   **New Container:** `redis:alpine`
-   **Port:** `6379` (Internal only, not exposed to host unless for debugging).
-   **Persistence:** `redis_data` volume to survive restarts.

### 2.2 Application Layer
-   **Dependency:** `ioredis` (Robust, supports promises/async).
-   **Service:** Refactor `src/services/cache.service.js`.
    -   **Current:** Uses `api_cache` table in MySQL.
    -   **New Strategy:** "Cache Aside" Pattern with Tiered Storage.
        1.  Check Redis.
        2.  If Miss -> Check MySQL (Optional, or just fetch fresh).
        3.  Fetch from API.
        4.  Store in Redis (TTL: 24h).

## 3. Implementation Steps

### Phase 1: Infrastructure
#### [MODIFY] [docker-compose.yml](file:///c:/Users/shashidhar/Desktop/MF-Investments/docker-compose.yml)
-   Add `redis` service.
-   Add `redis_data` volume.
-   Inject `REDIS_HOST`, `REDIS_PORT` to backend.

### Phase 2: Backend Logic
#### [MODIFY] [package.json](file:///c:/Users/shashidhar/Desktop/MF-Investments/package.json)
-   Install `ioredis`.

#### [MODIFY] [src/services/cache.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/cache.service.js)
-   Initialize Redis client.
-   Implement `get(key)`, `set(key, value, ttl)`, `del(key)`.
-   **Robustness:** Handle Redis connection failures gracefully (Fallback to Direct API or DB).

#### [MODIFY] [src/services/mfapiIngestion.service.js](file:///c:/Users/shashidhar/Desktop/MF-Investments/src/services/mfapiIngestion.service.js)
-   Ensure it uses the updated `cacheService` methods.

### Phase 3: Configuration
#### [MODIFY] [.env.example](file:///c:/Users/shashidhar/Desktop/MF-Investments/.env.example)
-   Add `REDIS_HOST=redis`, `REDIS_PORT=6379`.

## 4. Verification Plan

### Automated Tests
-   **Unit Tests:** Mock Redis client, verify `cacheService` calls.
-   **Integration:** Spin up Docker, write a key, read it back.

### Manual Verification
1.  Start stack with Redis.
2.  Trigger "Full Fund Sync".
3.  Check Redis keys (`docker compose exec redis redis-cli keys *`).
4.  Observe sync speed (should be faster than DB-based caching).
5.  **Simulate Failure:** Stop Redis container -> App should NOT crash (log error and continue).
