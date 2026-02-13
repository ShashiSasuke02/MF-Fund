# VPS Deployment Guide — MF-Investments

> **Prerequisite:** VPS with Docker installed. Domain `www.trymutualfunds.com` DNS pointing to VPS IP.

---

## Phase 1: Clone & Configure (5 min)

```bash
# 1. SSH into your VPS
ssh root@YOUR_VPS_IP

# 2. Clone the repo
cd /opt
git clone https://github.com/ShashiSasuke02/MF-Fund.git mf-fund
cd mf-fund

# 3. Switch to correct branch
git checkout Local-API-Setup

# 4. Create production .env from template
cp .env.example .env
nano .env
```

### Required `.env` changes (fill these):

```properties
# ─── Database (CHANGE THESE!) ────────────────────────────────
DB_USER=mf_user
DB_PASSWORD=YOUR_STRONG_DB_PASSWORD          # Generate: openssl rand -hex 16
DB_ROOT_PASSWORD=YOUR_STRONG_ROOT_PASSWORD   # Generate: openssl rand -hex 16
DB_NAME=mf_selection

# ─── Security ────────────────────────────────────────────────
JWT_SECRET=YOUR_64_CHAR_SECRET               # Generate: openssl rand -hex 32

# ─── Redis ───────────────────────────────────────────────────
REDIS_PASSWORD=YOUR_REDIS_PASSWORD           # Generate: openssl rand -hex 32

# ─── Email (Zoho SMTP) ──────────────────────────────────────
SMTP_HOST=smtppro.zoho.in
SMTP_PORT=465
SMTP_USER=support@trymutualfunds.com
SMTP_PASS=YOUR_ZOHO_APP_PASSWORD
SMTP_FROM=support@trymutualfunds.com
CRON_REPORT_EMAIL=shashidhar02april@gmail.com
BACKUP_EMAIL=shashidhar02april@gmail.com

# ─── AI (Ollama) ────────────────────────────────────────────
OLLAMA_ENDPOINT=http://YOUR_OLLAMA_IP:11434
OLLAMA_MODEL_NAME=qwen2.5:0.5b-instruct
```

> **Tip:** Generate passwords quickly:
> ```bash
> openssl rand -hex 32
> ```

---

## Phase 2: Start All Services (3 min)

```bash
# Build and start everything (uses VPS-specific compose file)
docker compose -f docker-compose.vps.yml up -d --build

# Watch the logs (wait for "Server running on port 4000")
docker compose -f docker-compose.vps.yml logs -f backend
# Press Ctrl+C to exit logs when you see the server is ready
```

### Verify containers are running:

```bash
docker compose -f docker-compose.vps.yml ps
```

Expected output — **6 healthy containers:**

| Container | Status |
|-----------|--------|
| `mf-investments-mysql` | Up (healthy) |
| `mf-investments-redis` | Up (healthy) |
| `mf-investments-app` | Up (healthy) |
| `mf-investments-nginx` | Up |
| `mf-investments-kuma` | Up |

> ⏳ **MySQL takes ~60 seconds** to initialize on first start. Wait for `service_healthy` before backend starts.

---

## Phase 3: Seed Admin User (1 min)

```bash
# Create your admin account
docker compose -f docker-compose.vps.yml run --rm seed-admin-job
```

> This creates the default admin user. You'll use these credentials to log in.

---

## Phase 4: Verify the App (2 min)

```bash
# Test health endpoint
curl http://localhost/api/health

# Test from outside (use your VPS IP)
curl http://YOUR_VPS_IP/api/health
```

Expected: `{"status":"ok","timestamp":"..."}` ✅

Open in browser: `http://YOUR_VPS_IP` — you should see the login page.

---

## Phase 5: Configure Uptime Kuma (5 min)

1. Open `http://YOUR_VPS_IP:3001` in your browser

2. **Create admin account** (first-time setup)

3. **Add HTTP Monitor** (App Health):
   - Type: **HTTP(s)**
   - Name: `MF-Fund App`
   - URL: `http://backend:4000/api/health`
   - Interval: **60 seconds**

4. **Add 4 Push Monitors** (Cron Heartbeats):

   | Name | Type | Interval |
   |------|------|----------|
   | SIP Scheduler | Push | 24 hours |
   | Full Fund Sync | Push | 24 hours |
   | AMFI NAV Sync | Push | 24 hours |
   | Daily Backup | Push | 24 hours |

5. For each Push monitor, copy the **Push URL** and update `.env`:

   ```bash
   nano /opt/mf-fund/.env
   ```

   ```properties
   KUMA_PUSH_SIP_URL=http://mf-investments-kuma:3001/api/push/XXXXX?status=up
   KUMA_PUSH_FUND_SYNC_URL=http://mf-investments-kuma:3001/api/push/XXXXX?status=up
   KUMA_PUSH_AMFI_SYNC_URL=http://mf-investments-kuma:3001/api/push/XXXXX?status=up
   KUMA_PUSH_BACKUP_URL=http://mf-investments-kuma:3001/api/push/XXXXX?status=up
   ```

6. **Restart backend** to pick up new env vars:
   ```bash
   docker compose -f docker-compose.vps.yml restart backend
   ```

7. **Set up notifications** in Kuma → Settings → Notifications:
   - Telegram, Email, Discord, or Slack

---

## Phase 6: Set Up Daily Backups (2 min)

```bash
# Make scripts executable
chmod +x scripts/backup-db.sh scripts/restore-db.sh

# Test backup manually
./scripts/backup-db.sh

# Set up daily cron (runs at 2 AM IST)
crontab -e
```

Add this line at the bottom:
```cron
0 2 * * * cd /opt/mf-fund && ./scripts/backup-db.sh >> logs/backup.log 2>&1
```

Save and exit (`Ctrl+X`, `Y`, `Enter` in nano).

---

## Phase 7: SSL with Nginx Proxy Manager (Optional but Recommended)

If you want HTTPS with `www.trymutualfunds.com`:

### Option A: Use a separate NPM container

```bash
# Install NPM alongside (on ports 80/443/81)
docker run -d \
  --name npm \
  --restart unless-stopped \
  --network mf-fund_mf-network \
  -p 80:80 \
  -p 443:443 \
  -p 81:81 \
  -v npm-data:/data \
  -v npm-letsencrypt:/etc/letsencrypt \
  jc21/nginx-proxy-manager:latest
```

> ⚠️ If NPM uses port 80, update `docker-compose.vps.yml` to change `WEB_PORT` to something else (e.g., 8080) so they don't conflict:
> ```bash
> # In .env
> WEB_PORT=8080
> docker compose -f docker-compose.vps.yml restart nginx
> ```

### Configure NPM:
1. Open `http://YOUR_VPS_IP:81`
2. Default login: `admin@example.com` / `changeme`
3. **Change password immediately**
4. Add Proxy Host:
   - Domain: `www.trymutualfunds.com`
   - Scheme: `http`
   - Forward Hostname: `mf-investments-nginx`
   - Forward Port: `80`
   - SSL → Request new Let's Encrypt certificate ✅
   - Force SSL ✅
   - HTTP/2 ✅

---

## Phase 8: VPS Firewall (Security)

```bash
# Allow only necessary ports
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 81/tcp      # NPM Admin (restrict to your IP later)
ufw allow 3001/tcp    # Uptime Kuma (restrict to your IP later)
ufw enable
ufw status
```

> 🔒 After setup, restrict admin ports to your IP only:
> ```bash
> ufw delete allow 81/tcp
> ufw allow from YOUR_HOME_IP to any port 81
> ufw delete allow 3001/tcp
> ufw allow from YOUR_HOME_IP to any port 3001
> ```

---

## Quick Reference Commands

```bash
# ─── Service Management ─────────────────────────
docker compose -f docker-compose.vps.yml up -d        # Start all
docker compose -f docker-compose.vps.yml down          # Stop all
docker compose -f docker-compose.vps.yml restart       # Restart all
docker compose -f docker-compose.vps.yml logs -f       # View all logs
docker compose -f docker-compose.vps.yml logs -f backend  # Backend logs only

# ─── Updates ─────────────────────────────────────
cd /opt/mf-fund
git pull origin Local-API-Setup
docker compose -f docker-compose.vps.yml up -d --build

# ─── Backup / Restore ───────────────────────────
./scripts/backup-db.sh                                 # Manual backup
./scripts/restore-db.sh ./backups/daily/2026-02-13.tar.gz  # Restore

# ─── Manual Sync ─────────────────────────────────
docker compose -f docker-compose.vps.yml run --rm sync-job

# ─── Check Health ────────────────────────────────
curl http://localhost/api/health
```

---

## ✅ Deployment Verification Checklist

- [ ] `docker compose ps` shows 5 containers running
- [ ] `curl http://VPS_IP/api/health` returns `{"status":"ok"}`
- [ ] Login page loads at `http://VPS_IP`
- [ ] Admin login works
- [ ] Uptime Kuma dashboard accessible at `:3001`
- [ ] Health monitor shows green in Kuma
- [ ] Backup cron test: `./scripts/backup-db.sh` succeeds
- [ ] Backup email received
- [ ] SSL works on `https://www.trymutualfunds.com` (after NPM setup)
- [ ] Firewall rules active (`ufw status`)
