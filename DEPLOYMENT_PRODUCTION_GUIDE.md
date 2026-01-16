# TryMutualFunds - Production Deployment & Installation Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Production Environment Setup](#production-environment-setup)
4. [Database Configuration](#database-configuration)
5. [Application Configuration](#application-configuration)
6. [Frontend Build & Deployment](#frontend-build--deployment)
7. [Backend Deployment](#backend-deployment)
8. [Security Hardening](#security-hardening)
9. [Monitoring & Logging](#monitoring--logging)
10. [Local Development Setup](#local-development-setup)
11. [Troubleshooting](#troubleshooting)
12. [Maintenance & Updates](#maintenance--updates)

---

## System Requirements

### Production Server
- **OS**: Linux (Ubuntu 20.04+ / RHEL 8+ recommended) or Windows Server 2019+
- **Node.js**: v18.x or v20.x LTS
- **Database**: MySQL 8.0+ or MariaDB 10.6+
- **Memory**: Minimum 2GB RAM (4GB+ recommended)
- **Storage**: Minimum 20GB SSD
- **Network**: Static IP with HTTPS support (SSL certificate required)

### Development Machine
- **OS**: Windows 10+, macOS 11+, or Linux
- **Node.js**: v18.x or v20.x LTS
- **Database**: MySQL 8.0+ or MariaDB 10.6+
- **Memory**: Minimum 4GB RAM
- **IDE**: VS Code recommended

---

## Pre-Deployment Checklist

### Code Quality & Testing
- [ ] All 134 tests passing (`npm test`)
- [ ] No critical bugs or security vulnerabilities
- [ ] Code reviewed and approved
- [ ] Git repository clean (all changes committed)

### Configuration Files
- [ ] Production `.env` file prepared with actual credentials
- [ ] Database connection details verified
- [ ] JWT secret generated (minimum 32 characters)
- [ ] CORS origins configured for production domain
- [ ] AdSense configuration completed (if monetizing)

### External Services
- [ ] MFAPI access verified (https://api.mfapi.in/)
- [ ] Domain name registered and DNS configured
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] Google AdSense account setup (if monetizing)

### Infrastructure
- [ ] Production server provisioned
- [ ] MySQL database server running
- [ ] Firewall rules configured (ports 80, 443, 3306)
- [ ] Backup strategy defined
- [ ] CDN configured (optional but recommended)

---

## Production Environment Setup

### 1. Server Provisioning

#### Option A: Cloud Deployment (AWS/Azure/GCP/DigitalOcean)

**AWS EC2 Example:**
```bash
# Launch t3.medium instance (2 vCPU, 4GB RAM)
# AMI: Ubuntu Server 22.04 LTS
# Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL - restricted)
```

**DigitalOcean Droplet Example:**
```bash
# Create Droplet
# Image: Ubuntu 22.04 LTS
# Plan: 2GB RAM / 1 vCPU / 50GB SSD ($12/month)
# Enable Monitoring & Backups
```

#### Option B: VPS/Dedicated Server
- Ensure root/sudo access
- Public IP address assigned
- SSH key authentication configured

### 2. Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x

# Install process manager (PM2)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install MySQL Server
sudo apt install -y mysql-server

# Install Git
sudo apt install -y git

# Install build essentials (for node-gyp)
sudo apt install -y build-essential python3
```

### 3. Create Application User

```bash
# Create dedicated user for app
sudo adduser --system --group --shell /bin/bash mfapp

# Switch to app user
sudo su - mfapp
```

---

## Database Configuration

### 1. MySQL Server Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Answer prompts:
# Set root password: YES (use strong password)
# Remove anonymous users: YES
# Disallow root login remotely: YES
# Remove test database: YES
# Reload privilege tables: YES
```

### 2. Create Production Database

```bash
# Login to MySQL as root
sudo mysql -u root -p

# Create database
CREATE DATABASE trymutualfunds CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user
CREATE USER 'mfapp_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';

# Grant privileges
GRANT ALL PRIVILEGES ON trymutualfunds.* TO 'mfapp_user'@'localhost';
FLUSH PRIVILEGES;

# Verify grants
SHOW GRANTS FOR 'mfapp_user'@'localhost';

# Exit MySQL
EXIT;
```

### 3. Configure MySQL for Production

Edit MySQL configuration:
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Recommended settings:
```ini
[mysqld]
# Connection Settings
max_connections = 200
connect_timeout = 10
wait_timeout = 600

# Buffer Sizes
innodb_buffer_pool_size = 1G  # 50-70% of available RAM
innodb_log_file_size = 256M

# Query Cache (if using MySQL 5.7)
# query_cache_type = 1
# query_cache_size = 64M

# Binary Logging (for backups)
log_bin = /var/log/mysql/mysql-bin.log
binlog_expire_logs_days = 7

# Error Logging
log_error = /var/log/mysql/error.log

# Slow Query Log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### 4. Test Database Connection

```bash
mysql -u mfapp_user -p -h localhost trymutualfunds

# Run test query
SELECT DATABASE();
SHOW TABLES;

EXIT;
```

---

## Application Configuration

### 1. Clone Repository

```bash
# As mfapp user
cd /home/mfapp
git clone https://github.com/YOUR_USERNAME/trymutualfunds.git app
cd app

# Checkout production branch (if applicable)
git checkout main  # or production branch
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install --production

# Install frontend dependencies
cd client
npm install --production
cd ..
```

### 3. Create Production Environment File

```bash
# Create .env file in root directory
nano .env
```

**Production `.env` Template:**
```env
# ================================
# SERVER CONFIGURATION
# ================================
NODE_ENV=production
PORT=4000

# ================================
# DATABASE CONFIGURATION
# ================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=mfapp_user
DB_PASSWORD=YOUR_STRONG_DATABASE_PASSWORD
DB_NAME=trymutualfunds

# ================================
# JWT CONFIGURATION
# ================================
JWT_SECRET=YOUR_256_BIT_RANDOM_SECRET_KEY_HERE
JWT_EXPIRES_IN=7d

# ================================
# SECURITY SETTINGS
# ================================
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com

# ================================
# EXTERNAL API CONFIGURATION
# ================================
MFAPI_BASE_URL=https://api.mfapi.in
MFAPI_TIMEOUT_MS=10000

# ================================
# CACHE CONFIGURATION
# ================================
CACHE_TTL_MS=3600000  # 1 hour

# ================================
# MFAPI INGESTION CONFIGURATION
# ================================
ENABLE_FULL_SYNC=true                # Daily 2 AM IST sync
ENABLE_INCREMENTAL_SYNC=false        # Optional market hours sync
ENABLE_MFAPI_FALLBACK=true           # Fallback for non-whitelisted AMCs
MFAPI_NAV_RETENTION=30               # Keep 30 NAV records per fund
MFAPI_BATCH_SIZE=50                  # Batch size for NAV fetch

# ================================
# SCHEDULER CONFIGURATION
# ================================
ENABLE_SCHEDULER_CRON=true           # Automated SIP/SWP/STP execution at 6 AM

# ================================
# GOOGLE ADSENSE (if monetizing)
# ================================
# Note: Configure client/.env separately for frontend
```

### 4. Generate JWT Secret

```bash
# Generate secure random secret (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output to JWT_SECRET in .env
```

### 5. Frontend Environment Configuration

```bash
cd client
nano .env
```

**Production `client/.env` Template:**
```env
# ================================
# API ENDPOINT
# ================================
VITE_API_URL=https://api.yourdomain.com  # Or same domain if serving from same server

# ================================
# GOOGLE ADSENSE CONFIGURATION
# ================================
VITE_ADSENSE_ENABLED=true
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_BANNER_SLOT=1234567890
VITE_ADSENSE_RECTANGLE_SLOT=0987654321
VITE_ADSENSE_DISPLAY_SLOT=1122334455
VITE_ADSENSE_INFEED_SLOT=5544332211
```

### 6. Initialize Database Schema

```bash
# Apply schema migrations
cd /home/mfapp/app
mysql -u mfapp_user -p trymutualfunds < src/db/schema.sql

# Verify tables created
mysql -u mfapp_user -p trymutualfunds -e "SHOW TABLES;"

# Expected output:
# +----------------------------+
# | Tables_in_trymutualfunds   |
# +----------------------------+
# | amc_master                 |
# | api_cache                  |
# | demo_accounts              |
# | execution_logs             |
# | fund_nav_history           |
# | fund_sync_log              |
# | funds                      |
# | holdings                   |
# | transactions               |
# | users                      |
# +----------------------------+
```

### 7. Seed Initial Data (Optional)

```bash
# Insert AMC master data
# Create seed script or insert manually
mysql -u mfapp_user -p trymutualfunds

INSERT INTO amc_master (fund_house, display_name, display_order) VALUES
('SBI Mutual Fund', 'SBI', 1),
('ICICI Prudential Mutual Fund', 'ICICI Prudential', 2),
('HDFC Mutual Fund', 'HDFC', 3),
('Nippon India Mutual Fund', 'Nippon India', 4),
('Kotak Mahindra Mutual Fund', 'Kotak', 5),
('Aditya Birla Sun Life Mutual Fund', 'Aditya Birla SL', 6),
('UTI Mutual Fund', 'UTI', 7),
('Axis Mutual Fund', 'Axis', 8),
('Tata Mutual Fund', 'Tata', 9),
('Mirae Asset Mutual Fund', 'Mirae Asset', 10);

EXIT;
```

---

## Frontend Build & Deployment

### 1. Build React Application

```bash
cd /home/mfapp/app/client

# Build production bundle
npm run build

# Verify build output
ls -lh dist/

# Expected structure:
# dist/
# ├── assets/         (JS/CSS bundles)
# ├── index.html      (Entry point)
# └── ...
```

### 2. Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/trymutualfunds
```

**Nginx Configuration:**
```nginx
# API Server (Backend)
upstream api_backend {
    server localhost:4000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;

    # SSL Configuration (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/trymutualfunds_access.log;
    error_log /var/log/nginx/trymutualfunds_error.log;

    # Root directory for React app
    root /home/mfapp/app/client/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/x-component;

    # API Reverse Proxy
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }

    # Static Assets Caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router (SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 3. Enable Nginx Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/trymutualfunds /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### 4. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# Enter email address
# Agree to terms
# Choose: Redirect HTTP to HTTPS (option 2)

# Verify auto-renewal
sudo certbot renew --dry-run

# Certificate will auto-renew via cron
```

---

## Backend Deployment

### 1. Configure PM2 Ecosystem

```bash
# Create PM2 configuration
cd /home/mfapp/app
nano ecosystem.config.cjs
```

**PM2 Configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'trymutualfunds-api',
    script: 'src/server.js',
    instances: 2,  // or 'max' for all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/home/mfapp/logs/api-error.log',
    out_file: '/home/mfapp/logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'client'],
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

### 2. Create Log Directory

```bash
mkdir -p /home/mfapp/logs
```

### 3. Start Application with PM2

```bash
# Start app
pm2 start ecosystem.config.cjs --env production

# Check status
pm2 status

# View logs
pm2 logs trymutualfunds-api

# Monitor resources
pm2 monit
```

### 4. Configure PM2 Startup

```bash
# Generate startup script
pm2 startup

# Copy and run the generated command
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u mfapp --hp /home/mfapp

# Save PM2 process list
pm2 save

# Verify startup configuration
sudo systemctl status pm2-mfapp
```

### 5. Verify Deployment

```bash
# Check if API is running
curl http://localhost:4000/api/health

# Expected response:
# {"status":"ok","timestamp":1234567890,"environment":"production"}

# Check external access (replace with your domain)
curl https://yourdomain.com/api/health
```

---

## Security Hardening

### 1. Firewall Configuration (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (change port if using non-standard)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MySQL only from localhost (default)
sudo ufw deny 3306/tcp

# Check status
sudo ufw status verbose
```

### 2. Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure for Nginx
sudo nano /etc/fail2ban/jail.local
```

**Fail2Ban Configuration:**
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/*access.log
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status
```

### 3. Secure MySQL

```bash
# Edit MySQL config
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Ensure MySQL binds only to localhost
bind-address = 127.0.0.1

# Restart MySQL
sudo systemctl restart mysql
```

### 4. Environment File Permissions

```bash
# Restrict .env file access
chmod 600 /home/mfapp/app/.env
chmod 600 /home/mfapp/app/client/.env

# Verify
ls -la /home/mfapp/app/.env
# Should show: -rw------- (only owner can read/write)
```

### 5. Regular Security Updates

```bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Check update status
sudo unattended-upgrades --dry-run --debug
```

---

## Monitoring & Logging

### 1. PM2 Monitoring

```bash
# Install PM2 Plus (optional - advanced monitoring)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 2. MySQL Slow Query Monitoring

```bash
# View slow queries
sudo tail -f /var/log/mysql/slow-query.log

# Analyze slow queries with pt-query-digest (install percona-toolkit)
sudo apt install -y percona-toolkit
pt-query-digest /var/log/mysql/slow-query.log
```

### 3. Nginx Log Monitoring

```bash
# Real-time access log
sudo tail -f /var/log/nginx/trymutualfunds_access.log

# Real-time error log
sudo tail -f /var/log/nginx/trymutualfunds_error.log

# Analyze access patterns with GoAccess (optional)
sudo apt install -y goaccess
goaccess /var/log/nginx/trymutualfunds_access.log --log-format=COMBINED
```

### 4. System Resource Monitoring

```bash
# Install htop
sudo apt install -y htop

# Monitor resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check MySQL process
ps aux | grep mysql
```

### 5. Uptime Monitoring (External)

Recommended services:
- **UptimeRobot** (https://uptimerobot.com/) - Free plan available
- **Pingdom** (https://www.pingdom.com/)
- **StatusCake** (https://www.statuscake.com/)

Configure monitors for:
- Website: `https://yourdomain.com/`
- API Health: `https://yourdomain.com/api/health`
- Frequency: Every 5 minutes

---

## Local Development Setup

### 1. Prerequisites

```bash
# Verify Node.js installation
node --version  # v18.x or v20.x
npm --version   # v9.x or v10.x

# Verify MySQL installation
mysql --version  # 8.0.x or higher
```

### 2. Clone Repository

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/trymutualfunds.git
cd trymutualfunds
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (root + client)
npm run install:all
```

### 4. Configure Local Environment

**Root `.env` file:**
```env
NODE_ENV=development
PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=trymutualfunds_dev

JWT_SECRET=your_dev_secret_key_here
JWT_EXPIRES_IN=7d

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:5173

MFAPI_BASE_URL=https://api.mfapi.in
MFAPI_TIMEOUT_MS=10000
CACHE_TTL_MS=3600000

# Scheduler (disabled by default in dev)
ENABLE_FULL_SYNC=false
ENABLE_INCREMENTAL_SYNC=false
ENABLE_SCHEDULER_CRON=false
```

**Client `.env` file:**
```env
VITE_API_URL=http://localhost:4000

# AdSense (disabled in development)
VITE_ADSENSE_ENABLED=false
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

### 5. Setup Local Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE trymutualfunds_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Apply schema
mysql -u root -p trymutualfunds_dev < src/db/schema.sql

# Verify tables
mysql -u root -p trymutualfunds_dev -e "SHOW TABLES;"
```

### 6. Start Development Servers

```bash
# Start both backend and frontend concurrently
npm run dev

# Or start separately:
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

### 7. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/api/health

### 8. Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit
```

---

## Troubleshooting

### Backend Issues

#### 1. Port 4000 Already in Use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:4000 | xargs kill -9

# Or change port in .env
PORT=4001
```

#### 2. Database Connection Failed

**Symptom:** `Database not initialized. Call initializeDatabase() first.`

**Solutions:**
```bash
# Verify MySQL is running
sudo systemctl status mysql

# Check connection credentials
mysql -u mfapp_user -p -h localhost trymutualfunds

# Verify .env file has correct credentials
cat .env | grep DB_

# Check MySQL error log
sudo tail -f /var/log/mysql/error.log
```

#### 3. JWT Authentication Errors

**Symptom:** `401 Unauthorized` or `Invalid token`

**Solutions:**
- Verify JWT_SECRET matches between frontend API calls and backend
- Check token expiration (JWT_EXPIRES_IN)
- Clear browser cookies/localStorage
- Regenerate JWT secret if compromised

#### 4. MFAPI Timeout Errors

**Symptom:** `MFAPI request timeout` or `ECONNREFUSED`

**Solutions:**
```bash
# Test MFAPI connectivity
curl https://api.mfapi.in/mf

# Increase timeout in .env
MFAPI_TIMEOUT_MS=30000  # 30 seconds

# Check firewall allows outbound HTTPS
curl -I https://api.mfapi.in
```

### Frontend Issues

#### 1. Blank Page After Build

**Symptom:** Production build shows blank page

**Solutions:**
- Check browser console for errors (F12)
- Verify API URL in client/.env points to correct backend
- Check Nginx serves index.html for all routes (SPA fallback)
- Rebuild with `npm run build` in client directory
- Clear browser cache

#### 2. API Calls Failing (CORS)

**Symptom:** `Access to fetch at 'http://localhost:4000/api/...' has been blocked by CORS policy`

**Solutions:**
- Verify CORS_ORIGIN in backend .env matches frontend URL
- Check backend logs for CORS preflight requests
- Ensure credentials: true in frontend axios config

#### 3. AdSense Not Showing

**Symptom:** Ads not displayed in production

**Solutions:**
- Verify VITE_ADSENSE_ENABLED=true in client/.env
- Check AdSense account approval status
- Verify ad unit IDs are correct
- Wait 24-48 hours after domain approval
- Check browser console for AdSense errors

### Database Issues

#### 1. Slow Query Performance

**Symptom:** API responses taking >2 seconds

**Solutions:**
```sql
-- Check slow queries
SELECT * FROM information_schema.processlist WHERE Time > 2;

-- Analyze table optimization
ANALYZE TABLE holdings;
ANALYZE TABLE transactions;

-- Check index usage
EXPLAIN SELECT * FROM holdings WHERE user_id = 1;

-- Add indexes if missing
CREATE INDEX idx_user_id ON holdings(user_id);
CREATE INDEX idx_scheme_code ON holdings(scheme_code);
```

#### 2. Out of Memory Errors

**Symptom:** MySQL crashes with `Out of memory`

**Solutions:**
```bash
# Reduce innodb_buffer_pool_size in my.cnf
innodb_buffer_pool_size = 512M  # Reduce from 1G

# Check memory usage
free -h

# Restart MySQL
sudo systemctl restart mysql
```

#### 3. Transaction Deadlocks

**Symptom:** `Deadlock found when trying to get lock`

**Solutions:**
- Check transaction isolation level
- Reduce concurrent transactions
- Add appropriate indexes
- Use smaller batch sizes in scheduler

### PM2 Issues

#### 1. App Not Starting

**Symptom:** `pm2 status` shows `errored`

**Solutions:**
```bash
# Check error logs
pm2 logs trymutualfunds-api --err

# Delete PM2 process and restart
pm2 delete trymutualfunds-api
pm2 start ecosystem.config.cjs --env production

# Verify .env file exists
ls -la /home/mfapp/app/.env
```

#### 2. High Memory Usage

**Symptom:** PM2 shows high memory usage, app restarts frequently

**Solutions:**
```bash
# Reduce PM2 instances
pm2 scale trymutualfunds-api 1

# Increase max_memory_restart in ecosystem.config.cjs
max_memory_restart: '1G'

# Check for memory leaks in logs
pm2 logs trymutualfunds-api | grep "memory"
```

### Nginx Issues

#### 1. 502 Bad Gateway

**Symptom:** Nginx returns 502 error

**Solutions:**
```bash
# Check if backend is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/trymutualfunds_error.log

# Verify upstream backend is accessible
curl http://localhost:4000/api/health

# Restart Nginx
sudo systemctl restart nginx
```

#### 2. SSL Certificate Errors

**Symptom:** `SSL certificate problem` or `NET::ERR_CERT_AUTHORITY_INVALID`

**Solutions:**
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Reload Nginx
sudo systemctl reload nginx
```

---

## Maintenance & Updates

### Daily Maintenance

```bash
# Check PM2 status
pm2 status

# Check disk space
df -h

# Check logs for errors
pm2 logs trymutualfunds-api --lines 100
```

### Weekly Maintenance

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check MySQL backups
ls -lh /var/backups/mysql/

# Review slow query log
sudo tail -100 /var/log/mysql/slow-query.log

# Check scheduler execution logs
pm2 logs trymutualfunds-api | grep "Scheduler"
```

### Monthly Maintenance

```bash
# Rotate logs manually if needed
pm2 flush

# Optimize MySQL tables
mysql -u root -p trymutualfunds -e "OPTIMIZE TABLE holdings, transactions, fund_nav_history;"

# Review and clean old execution logs
mysql -u root -p trymutualfunds -e "DELETE FROM execution_logs WHERE executed_at < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY)) * 1000;"

# Update Node.js packages (after testing in dev)
npm outdated
npm update
```

### Application Updates

#### 1. Pull Latest Code

```bash
cd /home/mfapp/app

# Backup current version
tar -czf ~/backup-$(date +%Y%m%d).tar.gz .

# Pull updates
git pull origin main

# Install new dependencies
npm install --production
cd client && npm install --production && cd ..
```

#### 2. Apply Database Migrations

```bash
# Check for new migration scripts
ls scripts/migrate-*.js

# Run migrations
node scripts/migrate-scheduler-columns.js
# Or apply SQL changes manually
mysql -u mfapp_user -p trymutualfunds < path/to/migration.sql
```

#### 3. Rebuild Frontend

```bash
cd client
npm run build
cd ..
```

#### 4. Restart Application

```bash
# Reload PM2 with zero-downtime
pm2 reload trymutualfunds-api

# Or restart
pm2 restart trymutualfunds-api

# Verify
pm2 status
curl https://yourdomain.com/api/health
```

### Backup Strategy

#### 1. Database Backups

**Automated Daily Backup Script:**
```bash
# Create backup script
nano /home/mfapp/scripts/backup-db.sh
```

```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="/var/backups/mysql"
DB_NAME="trymutualfunds"
DB_USER="mfapp_user"
DB_PASS="YOUR_PASSWORD"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_${DB_NAME}_${DATE}.sql.gz"
```

```bash
# Make script executable
chmod +x /home/mfapp/scripts/backup-db.sh

# Add to crontab (daily at 3 AM)
crontab -e

# Add line:
0 3 * * * /home/mfapp/scripts/backup-db.sh >> /home/mfapp/logs/backup.log 2>&1
```

#### 2. Application Backups

```bash
# Weekly full backup
tar -czf /var/backups/app-$(date +%Y%m%d).tar.gz /home/mfapp/app

# Keep last 4 weeks
find /var/backups -name "app-*.tar.gz" -mtime +28 -delete
```

#### 3. Restore from Backup

```bash
# Restore database
gunzip < /var/backups/mysql/backup_trymutualfunds_20260116_030000.sql.gz | mysql -u mfapp_user -p trymutualfunds

# Restore application
tar -xzf /var/backups/app-20260116.tar.gz -C /home/mfapp/app-restored
```

---

## Performance Optimization

### 1. Enable HTTP/2

Already configured in Nginx `http2` directive.

### 2. Enable Brotli Compression (Optional)

```bash
# Install Brotli module
sudo apt install -y nginx-module-brotli

# Add to Nginx config
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. Database Query Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX idx_holdings_user_scheme ON holdings(user_id, scheme_code);
CREATE INDEX idx_fund_nav_history_scheme_date ON fund_nav_history(scheme_code, nav_date);

-- Analyze query execution plans
EXPLAIN SELECT * FROM holdings WHERE user_id = 1;
```

### 4. Redis Caching (Advanced)

For high-traffic scenarios, consider implementing Redis for:
- API response caching
- Session storage
- Rate limiting

---

## Support & Resources

### Documentation
- **Project README**: [README.md](README.md)
- **API Documentation**: Available at `/api` endpoint
- **Scheduler Guide**: [documents/SCHEDULER_USAGE_GUIDE.md](documents/SCHEDULER_USAGE_GUIDE.md)
- **AdSense Guide**: [documents/GOOGLE_ADS_IMPLEMENTATION.md](documents/GOOGLE_ADS_IMPLEMENTATION.md)

### External Resources
- **Node.js Docs**: https://nodejs.org/docs/
- **MySQL Docs**: https://dev.mysql.com/doc/
- **Nginx Docs**: https://nginx.org/en/docs/
- **PM2 Docs**: https://pm2.keymetrics.io/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/

### Monitoring Services
- **New Relic APM**: https://newrelic.com/
- **Datadog**: https://www.datadog.com/
- **Sentry (Error Tracking)**: https://sentry.io/

---

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Last Updated**: January 16, 2026  
**Version**: 1.0.0  
**Maintainer**: Development Team
