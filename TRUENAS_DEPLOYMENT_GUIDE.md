# MF-Investments TrueNAS SCALE Deployment Guide

Deploy MF-Investments on your TrueNAS SCALE server as a Docker-based Custom App.

---

## Prerequisites

- **TrueNAS SCALE** 23.10 (Cobia) or newer
- **Apps Pool** configured in TrueNAS
- **SSH access** or Shell access via TrueNAS UI
- **Network access** to container image registries (Docker Hub)

---

## Quick Start

### Option A: Deploy with Docker Compose (Recommended)

1. **Create Dataset for App Data**
   ```
   Datasets → Add Dataset
   Name: mf-investments
   Path: /mnt/your-pool/apps/mf-investments
   ```

2. **SSH into TrueNAS** and clone the repository:
   ```bash
   ssh admin@your-truenas-ip
   cd /mnt/your-pool/apps
   git clone https://github.com/ShashiSasuke02/MF-Fund.git mf-investments
   cd mf-investments
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   nano .env  # Edit passwords and JWT_SECRET
   ```

4. **Start the Application**:
   ```bash
   docker compose --env-file .env up -d
   ```

5. **Access the App**: `http://your-truenas-ip:4000`

---

### Option B: TrueNAS Custom App UI (Alternative)

Use this if you prefer the TrueNAS web interface.

#### Step 1: Create Storage Datasets

In TrueNAS UI → **Datasets**:

| Dataset Name | Purpose |
|-------------|---------|
| `apps/mf-investments/mysql` | MySQL database files |
| `apps/mf-investments/app` | Application files |

#### Step 2: Deploy MySQL Container

1. Go to **Apps** → **Discover Apps** → **Custom App**
2. Configure:

| Setting | Value |
|---------|-------|
| **Application Name** | `mf-mysql` |
| **Image Repository** | `mysql` |
| **Image Tag** | `8.0` |

**Container Environment Variables:**
```
MYSQL_ROOT_PASSWORD = your_secure_root_password
MYSQL_DATABASE = mf_selection_app
MYSQL_USER = mf_user
MYSQL_PASSWORD = your_secure_password
```

**Storage:**
| Host Path | Mount Path |
|-----------|------------|
| `/mnt/pool/apps/mf-investments/mysql` | `/var/lib/mysql` |

**Networking:**
- Port: `3306` → `3306`

#### Step 3: Build and Push App Image

On a machine with Docker:
```bash
git clone https://github.com/ShashiSasuke02/MF-Fund.git
cd MF-Investments

# Build the image
docker build -t mf-investments:latest .

# Save for transfer
docker save mf-investments:latest -o mf-investments.tar

# Transfer to TrueNAS
scp mf-investments.tar admin@your-truenas-ip:/mnt/pool/apps/
```

On TrueNAS:
```bash
docker load -i /mnt/pool/apps/mf-investments.tar
```

#### Step 4: Deploy Backend Container

1. **Apps** → **Custom App**
2. Configure:

| Setting | Value |
|---------|-------|
| **Application Name** | `mf-investments` |
| **Image Repository** | `mf-investments` |
| **Image Tag** | `latest` |

**Container Environment Variables:**
```
NODE_ENV = production
PORT = 4000
DB_HOST = mf-mysql  (or TrueNAS IP if separate network)
DB_PORT = 3306
DB_USER = mf_user
DB_PASSWORD = your_secure_password
DB_NAME = mf_selection_app
JWT_SECRET = your_32_char_secret_here
MFAPI_BASE_URL = https://api.mfapi.in
ENABLE_SCHEDULER_CRON = true
ENABLE_FULL_SYNC = true
ENABLE_INCREMENTAL_SYNC = true
```

**Networking:**
- Port: `4000` → `4000`

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | - | MySQL hostname |
| `DB_PORT` | No | `3306` | MySQL port |
| `DB_USER` | Yes | - | MySQL username |
| `DB_PASSWORD` | Yes | - | MySQL password |
| `DB_NAME` | Yes | - | Database name |
| `JWT_SECRET` | Yes | - | JWT signing secret (32+ chars) |
| `PORT` | No | `4000` | API server port |
| `ENABLE_SCHEDULER_CRON` | No | `false` | Enable SIP/STP/SWP scheduler |
| `ENABLE_FULL_SYNC` | No | `false` | Enable nightly fund sync |

---

## Management Commands

```bash
# View logs
docker-compose logs -f backend

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Update application
git pull
docker-compose build
docker-compose up -d

# Database backup
docker exec mf-investments-db mysqldump -u mf_user -p mf_selection_app > backup.sql
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs mf-investments-app

# Common fixes:
# 1. Database not ready - wait 30s after mysql starts
# 2. Wrong DB credentials - verify .env
# 3. Port conflict - change APP_PORT in .env
```

### Database Connection Failed

```bash
# Test MySQL connection
docker exec -it mf-investments-db mysql -u mf_user -p

# Check MySQL is healthy
docker ps | grep mysql
```

### Application Health Check

```bash
# Test API health
curl http://your-truenas-ip:4000/api/health

# Expected response: {"status":"ok"}
```

---

## Backup & Recovery

### Backup Database
```bash
# Create backup
docker exec mf-investments-db mysqldump -u root -p mf_selection_app > /mnt/pool/backups/mf_$(date +%Y%m%d).sql
```

### Restore Database
```bash
# Restore from backup
docker exec -i mf-investments-db mysql -u root -p mf_selection_app < /mnt/pool/backups/mf_backup.sql
```

---

## Security Recommendations

1. **Change default passwords** in `.env`
2. **Generate secure JWT_SECRET**: `openssl rand -hex 32`
3. **Enable TrueNAS firewall** - only expose port 4000 to LAN
4. **Regular backups** - set up TrueNAS periodic snapshot tasks
5. **Keep images updated** - rebuild monthly for security patches

---

## Support

- **GitHub Issues**: [MF-Investments Issues](https://github.com/ShashidharBelavankiTR/MF-Investments/issues)
- **Documentation**: See `documents/` folder in repository
