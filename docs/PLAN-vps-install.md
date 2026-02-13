# PLAN: VPS Deployment & Cleanup Guide

**Goal:** Clean installation of MF-Fund on a fresh Ubuntu 22.04+ VPS OR updating an existing installation.
**Branch:** `Local-API-Setup` (Contains critical `.env` and backup fixes).
**Configuration:** `docker-compose.vps.yml`.

---

## ⚡ Quick Update (For Existing Installations)

If you already have the app running and just want to update to the latest version with clean containers:

1. **Navigate to the directory**
   ```bash
   cd /opt/mf-fund
   ```

2. **Stop & Remove Everything (Clean Slate)**
   ```bash
   # Stop all services and remove containers, networks
   docker compose -f docker-compose.vps.yml down

   # (Optional) Prune unused Docker objects to free space
   docker system prune -f
   ```

3. **Pull Latest Changes**
   ```bash
   git checkout Local-API-Setup
   git pull origin Local-API-Setup
   ```
   *Note: If you have local changes preventing pull, run `git reset --hard origin/Local-API-Setup` (Warning: deletes local changes)*

4. **Update Configuration**
   ```bash
   nano .env
   ```
   *   **Action:** Ensure `OLLAMA_ENDPOINT` is blank (`OLLAMA_ENDPOINT=`).
   *   **Action:** Remove ANY inline comments (e.g. `VAR=val # comment`).

5. **Rebuild & Start**
   ```bash
   docker compose -f docker-compose.vps.yml up -d --build
   ```

6. **Verify Logs**
   ```bash
   docker compose -f docker-compose.vps.yml logs -f backend
   # Press Ctrl+C to exit logs
   ```

---

## 🛠️ Fresh Installation (New Server)

### Phase 1: Server Preparation (5 Minutes)

Run these commands as `root` on your fresh VPS.

1. **Update System**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Install Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Verify Installation**
   ```bash
   docker compose version
   # Output should be v2.x.x
   ```

### Phase 2: Project Setup (2 Minutes)

1. **Clone Repository to `/opt`**
   ```bash
   cd /opt
   git clone https://github.com/ShashiSasuke02/MF-Fund.git mf-fund
   cd mf-fund
   ```

2. **Checkout Correct Branch**
   ```bash
   git checkout Local-API-Setup
   git pull origin Local-API-Setup
   ```

### Phase 3: Configuration (Critical Step)

1. **Create `.env` File**
   ```bash
   cp .env.example .env
   nano .env
   ```

2. **Edit `.env` - FOLLOW THESE RULES:**
   - ❌ **NO INLINE COMMENTS**. (e.g., `VAR=value # comment` -> **BAD**)
   - ✅ **Just values**. (e.g., `VAR=value`)
   - ✅ **OLLAMA_ENDPOINT**: Leave blank or set to empty string.

   **Correct `.env` Example snippet:**
   ```properties
   NODE_ENV=production
   PORT=4000
   
   # Database
   DB_HOST=mysql
   DB_USER=mf_user
   DB_PASSWORD=YOUR_SECURE_PASSWORD
   DB_ROOT_PASSWORD=YOUR_SECURE_ROOT_PASSWORD
   DB_NAME=mf_selection
   
   # Redis
   REDIS_PASSWORD=YOUR_REDIS_PASSWORD
   
   # Email
   SMTP_HOST=smtppro.zoho.in
   SMTP_USER=support@trymutualfunds.com
   SMTP_PASS=YOUR_ZOHO_PASSWORD
   BACKUP_EMAIL=shashidhar02april@gmail.com
   
   # AI (Leave Endpoint Blank for VPS if no local Ollama)
   OLLAMA_ENDPOINT=
   
   # Feature Flags
   ENABLE_SCHEDULER_CRON=true
   ```

### Phase 4: Build & Deploy (5 Minutes)

1. **Start Services** (Using VPS-specific compose file)
   ```bash
   docker compose -f docker-compose.vps.yml up -d --build
   ```

2. **Check Logs**
   ```bash
   docker compose -f docker-compose.vps.yml logs -f backend
   # Wait for "Server running on port 4000"
   ```

### Phase 5: Initialization (2 Minutes)

1. **Seed Admin User**
   ```bash
   docker compose -f docker-compose.vps.yml run --rm seed-admin-job
   ```
   *Note: This creates the default admin user.*

2. **Verify Health**
   ```bash
   curl http://localhost:4000/api/health
   # Expected: {"status":"ok", ...}
   ```

### Phase 6: Verify Backup Automation (New Feature)

We have automated backups. Let's verify they work immediately.

1. **Trigger Manual Backup Test** (Run inside container)
   ```bash
   docker compose -f docker-compose.vps.yml exec backend node -e "import('./src/services/backup.service.js').then(m => m.backupService.runDailyBackup())"
   ```

2. **Check Your Email**
   - You should receive an email with subject line akin to "Database Backup".
   - It should have a `.tar.gz` attachment.

3. **Check Uptime Kuma (Optional)**
   - Access Kuma at `http://YOUR_VPS_IP:3001`.
   - Setup monitors as needed.

---

## ❓ Troubleshooting

| Issue | Check | Fix |
|-------|-------|-----|
| **Backend crashes immediately** | `docker logs mf-investments-app` | likely `.env` parsing error. Edit `.env` to remove comments. |
| **MySQL Connection Refused** | `docker logs mf-investments-app` | Wait 60s. MySQL takes time to start first time. |
| **Backup Email Fails** | `logs/backup.log` or console output | Verify `SMTP_PASS` and `BACKUP_EMAIL` in `.env`. |
