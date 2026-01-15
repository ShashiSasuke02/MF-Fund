# Quick Deployment Guide

## Prerequisites
- Node.js v18+ installed
- npm or yarn package manager
- Production server (Heroku, Railway, Render, AWS, etc.)

---

## Step 1: Environment Setup

Create `.env` file in project root:

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Optional: Google AdSense (if monetizing)
VITE_ADSENSE_ENABLED=false
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
VITE_ADSENSE_BANNER_SLOT=1234567890
VITE_ADSENSE_RECTANGLE_SLOT=0987654321
VITE_ADSENSE_DISPLAY_SLOT=1122334455
VITE_ADSENSE_INFEED_SLOT=5544332211
```

**⚠️ IMPORTANT:** Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 2: Install Dependencies

```bash
npm run install:all
```

This installs both server and client dependencies.

---

## Step 3: Build Frontend

```bash
npm run build:client
```

This creates optimized production build in `client/dist/`

---

## Step 4: Database Setup

The SQLite database will be created automatically on first run in the `data/` directory.

For production, ensure `data/` directory is writable and backed up regularly.

---

## Step 5: Start Production Server

```bash
npm start
```

Server will start on the port specified in `.env` (default: 4000)

---

## Deployment Platforms

### Heroku

```bash
# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git push heroku main
```

### Railway

1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Create new Web Service
2. Connect repository
3. Build Command: `npm run install:all && npm run build:client`
4. Start Command: `npm start`
5. Add environment variables

### AWS EC2

```bash
# SSH into instance
ssh -i key.pem user@ec2-instance

# Clone repository
git clone your-repo-url
cd your-repo

# Install dependencies
npm run install:all

# Build frontend
npm run build:client

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name trymutualfunds
pm2 save
pm2 startup
```

---

## Step 6: Domain & SSL Setup

### Custom Domain
1. Point your domain's A record to your server IP
2. Update CORS settings in `src/app.js` if needed

### SSL Certificate (Let's Encrypt)
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update server to use HTTPS
# Or use a reverse proxy like Nginx
```

### Nginx Reverse Proxy (Recommended)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Step 7: Monitoring & Maintenance

### Health Check Endpoint
```
GET /api/health
```

### Log Monitoring
```bash
# With PM2
pm2 logs

# With systemd
journalctl -u trymutualfunds -f
```

### Database Backup
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp data/mutual-funds.db backups/mutual-funds_$DATE.db
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies (if package.json changed)
npm run install:all

# Rebuild frontend
npm run build:client

# Restart server
pm2 restart trymutualfunds
```

---

## Troubleshooting

### Server won't start
- Check `.env` file exists and has JWT_SECRET
- Verify port is not in use: `lsof -i :4000`
- Check logs for specific errors

### Database errors
- Ensure `data/` directory exists and is writable
- Check SQLite is properly installed
- Verify no file permission issues

### Frontend not loading
- Verify `npm run build:client` completed successfully
- Check `client/dist/` directory exists
- Ensure server is serving static files from `dist/`

### CORS errors
- Update CORS configuration in `src/app.js`
- Add your production domain to allowed origins

---

## Performance Optimization

### Enable Gzip Compression
```javascript
// In src/app.js
import compression from 'compression';
app.use(compression());
```

### Enable Caching Headers
Static assets are already cached via Express.static options.

### CDN Integration (Optional)
Upload `client/dist/` assets to CDN (Cloudflare, AWS CloudFront) for better performance.

---

## Security Checklist

- [x] JWT_SECRET is strong and secret
- [x] HTTPS enabled with SSL certificate
- [x] CORS configured for production domain only
- [x] Rate limiting enabled
- [x] Helmet security headers enabled
- [x] Database file permissions secured
- [x] Environment variables not committed to git
- [x] Regular security updates scheduled

---

## Scaling Considerations

### Horizontal Scaling
- Use PostgreSQL instead of SQLite
- Implement Redis for session storage
- Use load balancer (Nginx, AWS ALB)

### Database Migration
If scaling beyond SQLite:
```bash
# Export SQLite data
sqlite3 data/mutual-funds.db .dump > backup.sql

# Import to PostgreSQL
# Update database connection in code
```

---

## Support

For issues or questions:
1. Check [PRODUCTION_READINESS_REPORT.md](PRODUCTION_READINESS_REPORT.md)
2. Review logs for error details
3. Verify environment configuration
4. Check documentation files in project root

---

## Quick Commands Reference

```bash
# Development
npm run dev                    # Start dev server (backend + frontend)
npm run dev:server            # Start backend only
npm run dev:client            # Start frontend only

# Production
npm run install:all           # Install all dependencies
npm run build:client          # Build frontend for production
npm start                     # Start production server

# Maintenance
npm run dev:server           # Use for debugging in production
```

---

**Ready to deploy!** 🚀

Choose your platform, follow the steps above, and your TryMutualFunds application will be live.
