# TrueNAS: Complete Wipe & Reinstall Guide (Nuclear Option)

> ⚠️ **DANGER:** This process will **DELETE ALL DATA**, including:
> -   User accounts & Demo Portfolios
> -   Mutual Fund Data (will need re-syncing)
> -   Transaction History
> -   Logs
> 
> **Proceed only if you want a fresh start.**

---

## Step 1: Connect to TrueNAS Shell
Open the Shell in your TrueNAS UI or SSH into the server. Navigate to your project directory:

```bash
cd /mnt/pool/path/to/MF-Investments
```

*(Adjust the path to where you cloned the repo)*

---

## Step 2: Stop & Remove Containers
Stop the running application and remove the containers.

```bash
docker compose down
```

---

## Step 3: The "Deep Clean" (Delete Volumes)
This is the step that makes it a "Clean Install". 

```bash
# 1. Remove associated volumes (Database & Logs)
docker compose down -v

# 2. (Optional) Prune unused Docker images to free space
docker system prune -f
```

---

## Step 4: Update Codebase
Ensure you have the latest code with all the recent fixes (Sync, AMC, AI).

```bash
# 1. Reset local changes (if any)
git reset --hard

# 2. Pull latest version
git pull origin Local-API-Setup
```

---

## Step 5: Verify Configuration (.env)
Check if your `.env` file is correct or needs updating.

```bash
nano .env
```

**Ensure these values are set:**
```ini
# Database
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=rootpassword
DB_NAME=mf_portfolio

# App
PORT=4000
JWT_SECRET=your_super_secret_key_change_this

# AI (Ollama) - New Feb 2026
OLLAMA_ENDPOINT=http://192.168.1.4:11434
OLLAMA_MODEL_NAME=qwen2.5:0.5b-instruct
```
*(Press `Ctrl+X`, then `Y`, then `Enter` to save if you edit)*

---

## Step 6: Rebuild & Start
Clean build everything from scratch to ensure no old cache remains.

```bash
docker compose up -d --build
```

---

## Step 7: Post-Install Actions

### 1. Wait for Database
The `mysql` container takes about 30-60 seconds to initialize for the first time. Check logs:
```bash
docker compose logs -f backend
```
Wait until you see: `[Server] Database connected successfully`.

### 2. Create Admin User
Since the database was wiped, you need to recreate your admin account.
```bash
# Enter the backend container
docker compose exec backend sh

# Run the seed script
node scripts/seed-admin.js

# Exit
exit
```

### 3. Sync Mutual Fund Data
The database is empty. You need to fetch the funds.
1.  Log in to the App (`admin` / `admin123` - default from seed).
2.  Go to **Admin Dashboard**.
3.  Click **"Full Fund Sync"**.
4.  **Wait:** This will take 2-5 minutes.
5.  Check your email (if configured) or the logs for completion.

### 4. Remove Duplicates (Safety Measure)
Run the cleanup script just in case:
```bash
docker compose exec backend node scripts/fix-amc-duplicates.js
```

---

## Verification
-   **App URL:** `http://<YOUR-IP>:4000`
-   **Funds:** Should be visible on "Browse Funds" page after sync.
-   **AI:** Chat should work immediately (if Ollama is running).
