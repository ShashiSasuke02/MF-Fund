# Project Plan: VPS Deployment with Nginx Proxy Manager

## 1. Goal
Deploy the `MF-Investments` application to a production VPS using Docker Compose, with **Nginx Proxy Manager (NPM)** handling SSL termination and domain routing for `www.trymutualfunds.com`.

## 2. Architecture Changes

### Docker Compose (`docker-compose.yml`)
-   **Add Service:** `nginx-proxy-manager` (Image: `jc21/nginx-proxy-manager:latest`).
-   **Ports:**
    -   Host `80` -> NPM `80` (HTTP)
    -   Host `443` -> NPM `443` (HTTPS)
    -   Host `81` -> NPM `81` (Admin UI)
-   **Network:** Add to `mf-network` so it can reach `backend`.
-   **Volumes:** Persist NPM data and Let's Encrypt certificates to `./npm-data`.
-   **Remove:** Existing raw `nginx` service (superseded by NPM).
-   **Backend:** Ensure `backend` service is on `mf-network`. It does *not* need to expose port `4000` to the host public IP, only to the internal network.

### Security Groups (VPS Firewall)
-   Allow Inbound TCP 80, 443 (Web).
-   Allow Inbound TCP 81 (Admin UI - restrictedIP recommended).
-   Allow Inbound TCP 22 (SSH).

## 3. Implementation Steps

### Phase 1: Configuration Update
1.  **Modify `docker-compose.yml`**:
    -   Insert NPM service definition.
    -   Configure volumes for persistence.
    -   Remove old Nginx service.
2.  **Update `ARCHITECTURE.md`**:
    -   Reflect the new edge routing strategy.

### Phase 2: Server Prep (User Actions)
1.  **DNS:** Ensure `www.trymutualfunds.com` points to VPS IP.
2.  **SSH:** distinct user/key setup (already done likely).

### Phase 3: Deployment
1.  **Transfer Code:** Git clone or copy project to VPS.
2.  **Environment:** Create `.env` file from `.env.example` with production secrets.
3.  **Start Services:** `docker-compose up -d`.

### Phase 4: NPM Configuration (One-Time)
1.  Access `http://<VPS-IP>:81`.
2.  Login (Default: `admin@example.com` / `changeme`).
3.  Change credentials.
4.  **Add Proxy Host:**
    -   Domain: `www.trymutualfunds.com`
    -   Scheme: `http`
    -   Forward Hostname: `backend` (Docker service name)
    -   Forward Port: `4000`
    -   **SSL:** Request new Let's Encrypt certificate (Force SSL, HTTP/2).

## 4. Verification Checklist
- [ ] Docker containers running (`backend`, `mysql`, `redis`, `npm`).
- [ ] NPM Admin accessible at port 81.
- [ ] Domain `www.trymutualfunds.com` loads the app via HTTPS.
- [ ] API requests (e.g., login) work correctly via the domain.
