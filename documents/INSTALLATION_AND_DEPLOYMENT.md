# Installation and Deployment Guide

Complete step-by-step guide for installing and deploying the MF Investments Application in production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Testing](#testing)
7. [Building for Production](#building-for-production)
8. [Production Deployment](#production-deployment)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start (Plain Language)

If you just need the app running locally on Windows and are not technical, follow these five steps:

1) Install Node.js 18+: download from https://nodejs.org, install with defaults. After install, open PowerShell and run `node -v` (should show 18.x or higher).
2) Get the code: open PowerShell, run `git clone https://github.com/ShashidharBelavankiTR/MF-Investments.git` and then `cd MF-Investments`.
3) Install everything: run `npm run install:all`. Wait until it finishes (may take a few minutes).
4) Start in development: run `npm run dev`. Backend will be at http://localhost:4000 and frontend will open at http://localhost:5173 (or 5174 if 5173 is busy). Leave the window open while you use the app.
5) Stop it: press `Ctrl + C` in the PowerShell window to stop both servers.

For production deployment (server), see the detailed steps later in this guide.

---

## Prerequisites

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Node.js**: Version 18.x or higher
- **NPM**: Version 9.x or higher
- **RAM**: Minimum 4GB, Recommended 8GB
- **Disk Space**: Minimum 500MB free space
- **Internet Connection**: Required for API access and package installation

### Required Software

1. **Node.js and NPM**
   ```bash
   # Verify installation
   node --version  # Should be v18.x or higher
   npm --version   # Should be v9.x or higher
   ```

2. **Git** (for version control)
   ```bash
   git --version   # Should be v2.x or higher
   ```

3. **Code Editor** (recommended: VS Code)

---

## Development Environment Setup

### 1. Clone the Repository

```bash
# Using HTTPS
git clone https://github.com/ShashidharBelavankiTR/MF-Investments.git

# Navigate to project directory
cd MF-Investments
```

### 2. Verify Project Structure

```
MF-Investments/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── src/                    # Express backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── db/
│   ├── app.js
│   └── server.js
├── tests/                  # Test suite
├── scripts/                # Utility scripts
├── documents/              # Documentation
├── .env                    # Environment variables (create this)
├── package.json            # Backend dependencies
└── README.md
```

---

## Installation Steps

### Step 1: Install Backend Dependencies

```bash
# From project root directory
npm install
```

This will install:
- Express.js (web framework)
- SQLite (database)
- JWT (authentication)
- Bcrypt (password hashing)
- Axios (HTTP client)
- Helmet (security)
- CORS (cross-origin resource sharing)
- Morgan (logging)
- Other required packages

### Step 2: Install Frontend Dependencies

```bash
# Install frontend dependencies
npm run install:all

# Or manually
cd client
npm install
cd ..
```

This will install:
- React 18 (UI library)
- React Router (routing)
- Vite (build tool)
- TailwindCSS (styling)
- Other required packages

### Step 3: Initialize Database

```bash
# The database will be automatically created on first run
# No manual initialization required
```

---

## Configuration

### Step 1: Backend Environment Variables

Create `.env` file in the project root:

```bash
# Copy from example
cp .env.example .env
```

Edit `.env` file:

```dotenv
# Server Configuration
PORT=4000
NODE_ENV=production

# JWT Secret (IMPORTANT: Change in production)
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production-min-32-chars

# If your `.env` is missing `JWT_SECRET`, add it manually:
# 1) Create or edit .env in the project root
# 2) Add a strong 32+ character value, e.g.
# JWT_SECRET=1f3d6b0c9e7a4d2b8c5f1a3e6d8c9b7a
# 3) Restart the server after saving

# MFapi.in Configuration
MFAPI_BASE_URL=https://api.mfapi.in
MFAPI_TIMEOUT_MS=15000

# Cache TTL (in milliseconds)
CACHE_TTL_LATEST_NAV_MS=3600000      # 1 hour
CACHE_TTL_SCHEME_DETAILS_MS=1800000  # 30 minutes
CACHE_TTL_NAV_HISTORY_MS=21600000    # 6 hours

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000           # 1 minute
RATE_LIMIT_MAX_REQUESTS=100          # 100 requests per minute
```

**CRITICAL**: Generate a strong JWT secret:

```bash
# Generate a secure random string (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Frontend Environment Variables

Create `client/.env` file:

```bash
# Copy from example
cp client/.env.example client/.env
```

Edit `client/.env` file:

```dotenv
# Google AdSense Configuration
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_BANNER_SLOT=1234567890
VITE_ADSENSE_RECTANGLE_SLOT=0987654321
VITE_ADSENSE_DISPLAY_SLOT=1122334455
VITE_ADSENSE_INFEED_SLOT=5544332211
VITE_ADSENSE_ENABLED=true
```

**Note**: Replace with your actual Google AdSense credentials.

### Step 3: Update AdSense Script in HTML

Edit `client/index.html`:

```html
<!-- Replace with your AdSense Publisher ID -->
<script 
  async 
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
  crossorigin="anonymous">
</script>
```

---

## Running the Application

### Development Mode

```bash
# Start both backend and frontend in development mode
npm run dev
```

This will:
- Start backend server on `http://localhost:4000`
- Start frontend dev server on `http://localhost:5173`
- Enable hot-reload for both

### Alternative: Run Separately

```bash
# Terminal 1: Start backend
npm run dev:server

# Terminal 2: Start frontend
npm run dev:client
```

### Verify Application is Running

1. **Backend Health Check**:
   ```bash
   curl http://localhost:4000/api/health
   ```
   Expected response: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: Open browser at `http://localhost:5173`

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage report
npm run test:coverage

# Watch mode (for development)
npm run test:watch
```

### Expected Test Results

```
Test Suites: 3 passed, 3 total
Tests:       67 passed, 67 total
Snapshots:   0 total
Time:        ~1s
```

---

## Building for Production

### Step 1: Build Frontend

```bash
npm run build:client
```

This will:
- Create optimized production build in `client/dist/`
- Minify JavaScript and CSS
- Optimize images and assets
- Generate source maps

### Step 2: Verify Build

```bash
# Check build directory
ls -la client/dist

# Expected files:
# - index.html
# - assets/
#   - index-[hash].js
#   - index-[hash].css
```

### Step 3: Test Production Build Locally

```bash
# Preview production build
cd client
npm run preview
```

---

## Production Deployment

### Option 1: Traditional Server (VPS/Dedicated Server)

#### Prerequisites
- Ubuntu 20.04+ or CentOS 7+ server
- Root or sudo access
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install -y nginx

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 2: Deploy Application

```bash
# 1. Clone repository
cd /var/www
sudo git clone https://github.com/ShashidharBelavankiTR/MF-Investments.git
cd MF-Investments

# 2. Install dependencies
sudo npm run install:all

# 3. Create production environment file
sudo nano .env
# (Paste production environment variables)

# 4. Create frontend environment file
sudo nano client/.env
# (Paste production AdSense credentials)

# 5. Build frontend
sudo npm run build:client

# 6. Set proper permissions
sudo chown -R $USER:$USER /var/www/MF-Investments
```

#### Step 3: Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'mf-investments',
    script: 'src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

Start application:

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# (Run the command it suggests)

# Verify application is running
pm2 status
pm2 logs
```

#### Step 4: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/mf-investments
```

Add configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    
    # Frontend (React SPA)
    root /var/www/MF-Investments/client/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy to Backend
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # SPA Routing - Serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site and test:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mf-investments /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 5: Setup SSL with Let's Encrypt

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Step 6: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify
sudo ufw status
```

---

### Option 2: Cloud Platform (Heroku, Railway, Render)

#### Heroku Deployment

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**:
   ```bash
   heroku create mf-investments-app
   ```

3. **Add Buildpacks**:
   ```bash
   heroku buildpacks:add heroku/nodejs
   ```

4. **Configure Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-secret-key
   # Add all other environment variables
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

6. **Open App**:
   ```bash
   heroku open
   ```

---

### Option 3: Docker Deployment

#### Create Dockerfile

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install:all

# Copy application files
COPY . .

# Build frontend
RUN npm run build:client

# Expose port
EXPOSE 4000

# Start application
CMD ["npm", "start"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PORT=4000
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

#### Deploy with Docker

```bash
# Build image
docker build -t mf-investments .

# Run container
docker run -d -p 4000:4000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret \
  --name mf-investments \
  mf-investments

# Or use docker-compose
docker-compose up -d
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
# Backend health
curl https://yourdomain.com/api/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 2. Test Core Functionality

1. **Open Application**: Visit `https://yourdomain.com`
2. **Register**: Create a new user account
3. **Login**: Login with credentials
4. **Browse AMCs**: Navigate to AMC list
5. **View Funds**: Click on any AMC
6. **View Details**: Click on any fund
7. **Invest**: Make a demo investment
8. **Portfolio**: Check portfolio page
9. **Transactions**: Verify transaction history
10. **Systematic Plans**: Check SIP/STP/SWP view

### 3. Performance Testing

```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health

# Load testing (using Apache Bench)
ab -n 1000 -c 10 https://yourdomain.com/api/health
```

### 4. Security Verification

1. **HTTPS**: Verify SSL certificate
2. **Headers**: Check security headers
3. **Authentication**: Test JWT tokens
4. **Rate Limiting**: Test rate limiting

### 5. Monitor Logs

```bash
# PM2 logs
pm2 logs mf-investments

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f logs/out.log
tail -f logs/err.log
```

---

## Monitoring and Maintenance

### 1. Setup Monitoring

**PM2 Monitoring**:
```bash
# PM2 Plus (free tier)
pm2 link your-secret-key your-public-key

# Monitor metrics
pm2 monit
```

**Application Monitoring**:
- Use services like New Relic, Datadog, or Sentry
- Monitor:
  - Response times
  - Error rates
  - CPU/Memory usage
  - Database performance

### 2. Log Management

```bash
# Rotate logs (setup logrotate)
sudo nano /etc/logrotate.d/mf-investments
```

Add configuration:
```
/var/www/MF-Investments/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### 3. Backup Strategy

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/var/backups/mf-investments"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
mkdir -p $BACKUP_DIR
cp /var/www/MF-Investments/data/*.db $BACKUP_DIR/db_$DATE.db

# Backup environment files
cp /var/www/MF-Investments/.env $BACKUP_DIR/env_$DATE

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

### 4. Update Strategy

```bash
# Update application
cd /var/www/MF-Investments
git pull origin main
npm run install:all
npm run build:client
pm2 restart mf-investments
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

#### 2. Database Connection Issues

```bash
# Check database file
ls -la data/

# Reset database (CAUTION: This deletes all data)
npm run db:cleanup
```

#### 3. Frontend Build Fails

```bash
# Clear cache and rebuild
cd client
rm -rf node_modules dist
npm install
npm run build
```

#### 4. PM2 Won't Start

```bash
# Check logs
pm2 logs

# Reset PM2
pm2 kill
pm2 start ecosystem.config.js
```

#### 5. Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart all
sudo systemctl restart nginx
```

#### 6. SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Test certificate
sudo certbot certificates
```

### Debug Mode

Enable debug logging:

```bash
# In .env
NODE_ENV=development

# Restart application
pm2 restart mf-investments
```

---

## Performance Optimization

### 1. Enable Caching

Already implemented:
- API response caching (in-memory)
- Static asset caching (Nginx)
- Browser caching (Cache-Control headers)

### 2. Database Optimization

```javascript
// Already optimized with indexes
// Check database indexes:
// - users: username, email
// - transactions: user_id, scheme_code
// - holdings: user_id, scheme_code
```

### 3. CDN Integration (Optional)

For better performance, serve static assets via CDN:
- Cloudflare
- AWS CloudFront
- Azure CDN

---

## Security Checklist

- [x] JWT secret is strong and unique
- [x] HTTPS enabled with valid SSL certificate
- [x] Security headers configured (Helmet.js)
- [x] Rate limiting enabled
- [x] CORS properly configured
- [x] Input validation implemented
- [x] Password hashing (bcrypt)
- [x] SQL injection prevention (parameterized queries)
- [x] XSS protection
- [x] Environment variables secured
- [x] Error messages don't expose sensitive info
- [x] Logs don't contain passwords/tokens
- [x] Regular security updates

---

## Support and Resources

### Documentation
- [README.md](README.md) - Project overview
- [PROJECT_DETAILS.md](PROJECT_DETAILS.md) - Technical details
- [GOOGLE_ADS_IMPLEMENTATION.md](GOOGLE_ADS_IMPLEMENTATION.md) - AdSense setup
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Additional deployment info

### External Resources
- **MFapi.in Documentation**: https://www.mfapi.in
- **Express.js**: https://expressjs.com
- **React**: https://react.dev
- **PM2**: https://pm2.keymetrics.io
- **Nginx**: https://nginx.org/en/docs/

### Support
- GitHub Issues: https://github.com/ShashidharBelavankiTR/MF-Investments/issues
- Email: support@trymutualfunds.com

---

## Changelog

### Version 1.0.0 (January 2026)
- Initial production release
- Complete demo trading system
- Google AdSense integration
- Systematic plans (SIP/STP/SWP)
- Portfolio tracking
- Transaction history
- 67 unit tests (100% pass rate)

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: January 14, 2026  
**Document Version**: 1.0.0
