# Deployment Guide for TrueNAS / Docker

This guide explains how to build and deploy the application (Frontend + Backend) on TrueNAS Scale or any Docker-enabled server.

## 1. Prerequisites
- **Git** installed on the server (or means to copy files).
- **Docker** and **Docker Compose** installed.
- **Root/Shell Access** to the mapped folder.

## 2. Copy Code to Server
If you are using Git:
```bash
cd /mnt/pool/path/to/MF-Investments
git pull origin Local-API-Setup
```
*Alternatively, copy the files manually (via SMB/SFTP).*

## 3. Configure Environment
Ensure your `.env` file exists and contains the latest keys:

```bash
cp .env.example .env
nano .env
```

**Add/Verify these new AI keys at the bottom of `.env`:**
```ini
# AI Mutual Fund Manager (Ollama)
OLLAMA_ENDPOINT=http://192.168.1.4:11434
OLLAMA_MODEL_NAME=qwen2.5:0.5b
AI_SYSTEM_PROMPT=You are a helpful AI Mutual Fund Manager assistant...
```

## 4. Build and Deploy
Run the following command to rebuild the container with the latest changes (including the new React frontend build):

```bash
docker compose down
docker compose up -d --build
```

### Explanation:
- `down`: Stops and removes old containers.
- `up -d`: Starts new containers in detached mode.
- `--build`: Forces a rebuild of the Docker image (Crucial for picking up new React code).

## 5. Usage Commands

**Check Logs:**
```bash
docker compose logs -f backend
```

**Check Status:**
```bash
docker compose ps
```

**Run Manual Sync:**
```bash
docker compose run --rm sync-job
```

## 6. Access
- **Application:** `http://<YOUR-TRUENAS-IP>:4000` (or configured port)
- **AI Chat:** Log in, then click the floating icon in the bottom-right.
