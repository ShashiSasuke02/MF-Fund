# MF Selection App: Installation Guide for Debian Bullseye (amd64) in a Container

This guide provides step-by-step instructions to install and run the MF Selection App (Express + React + MySQL) in a Debian Bullseye (amd64) container environment.

---

## Prerequisites
- Debian Bullseye (amd64, default)
- Root or sudo access
- Internet connectivity

---

## 1. Update System
```
sudo apt-get update && sudo apt-get upgrade -y
```

## 2. Install Required Packages
```
sudo apt-get install -y curl git build-essential
```

## 3. Install Node.js (LTS) & npm
```
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

## 4. Install MySQL Server
```
sudo apt-get install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
```

## 5. Configure MySQL
- Secure installation:
```
sudo mysql_secure_installation
```
- Create database and user:
```
sudo mysql -u root -p
```
Inside MySQL shell:
```
CREATE DATABASE mf_selection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mf_user'@'%' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON mf_selection.* TO 'mf_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

## 6. Clone the Application Repository
```
git clone <your-repo-url> mf-selection-app
cd mf-selection-app
```

## 7. Configure Environment Variables
- Copy `.env.example` to `.env` in the root and `client/` directories.
- Edit `.env` files with your MySQL credentials and secrets:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=mf_user
DB_PASSWORD=your_strong_password
DB_NAME=mf_selection
# ...other settings as needed
```

## 8. Install Dependencies
```
npm run install:all
```

## 9. Initialize Database Schema
```
node scripts/migrate-fund-tables.js
```

## 10. Build Frontend (Production)
```
npm run build:client
```

## 11. Start the Application
- For production:
```
NODE_ENV=production npm start
```
- For development (API + client hot reload):
```
npm run dev
```

## 12. Access the Application
- API: http://localhost:4000/api/health
- Frontend: http://localhost:4000/

---

## 13. (Optional) Run Tests
```
npm test
```

---

## 14. Containerization Tips
- Expose ports 4000 (API/Frontend) and 3306 (MySQL) as needed.
- Use Docker volumes for persistent MySQL data.
- For Dockerfile/compose, see project documentation or request a sample.

---

## Troubleshooting
- Check `.env` for correct DB credentials.
- Use `npm run db:inspect` to verify DB connection.
- Logs: check console output for errors.

---

## References
- Node.js: https://nodejs.org/en
- MySQL: https://dev.mysql.com/doc/
- Project README.md for more details

---

**End of Guide**
