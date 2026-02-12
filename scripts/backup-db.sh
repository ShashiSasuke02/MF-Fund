#!/bin/bash
# =============================================================================
# MF-Investments — Daily Database Backup Script
# =============================================================================
# Backs up 6 core tables (excludes fund_nav_history which is re-syncable).
# Compresses output, retains 7 daily backups, optionally emails the file
# and pings Uptime Kuma on success.
#
# Usage (from project root on VPS):
#   ./scripts/backup-db.sh
#
# Crontab entry (2 AM IST daily):
#   0 2 * * * cd /path/to/MF-Fund && ./scripts/backup-db.sh >> logs/backup.log 2>&1
# =============================================================================

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────────────
BACKUP_DIR="./backups/daily"
RETENTION_DAYS=7
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d_%H:%M:%S)
BACKUP_FILE="${BACKUP_DIR}/${DATE}.sql"
ARCHIVE_FILE="${BACKUP_DIR}/${DATE}.tar.gz"
COMPOSE_FILE="docker-compose.vps.yml"

# Load environment variables from .env
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Tables to back up (excludes fund_nav_history — can be re-synced from AMFI)
TABLES="users demo_accounts holdings transactions ledger_entries funds"

# ─── Helpers ─────────────────────────────────────────────────────────────────
log() {
    echo "[${TIMESTAMP}] $1"
}

error_exit() {
    log "❌ ERROR: $1"
    exit 1
}

# ─── Pre-flight Checks ─────────────────────────────────────────────────────
log "🔄 Starting daily backup..."

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Check Docker Compose file
if [ ! -f "${COMPOSE_FILE}" ]; then
    # Fall back to default compose file
    COMPOSE_FILE="docker-compose.yml"
    if [ ! -f "${COMPOSE_FILE}" ]; then
        error_exit "No docker-compose file found"
    fi
fi

# ─── Dump Database ──────────────────────────────────────────────────────────
log "📦 Dumping tables: ${TABLES}"

docker compose -f "${COMPOSE_FILE}" exec -T mysql mysqldump \
    -u"${DB_USER:-mf_user}" \
    -p"${DB_PASSWORD:-mf_password}" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    "${DB_NAME:-mf_selection}" \
    ${TABLES} > "${BACKUP_FILE}" \
    || error_exit "mysqldump failed"

# Verify dump is not empty
if [ ! -s "${BACKUP_FILE}" ]; then
    error_exit "Backup file is empty"
fi

# ─── Log Row Counts ─────────────────────────────────────────────────────────
log "📊 Row counts:"
for TABLE in ${TABLES}; do
    COUNT=$(docker compose -f "${COMPOSE_FILE}" exec -T mysql mysql \
        -u"${DB_USER:-mf_user}" \
        -p"${DB_PASSWORD:-mf_password}" \
        -N -e "SELECT COUNT(*) FROM ${TABLE}" \
        "${DB_NAME:-mf_selection}" 2>/dev/null || echo "?")
    log "   ${TABLE}: ${COUNT} rows"
done

# ─── Compress ───────────────────────────────────────────────────────────────
log "🗜️ Compressing..."
tar -czf "${ARCHIVE_FILE}" -C "${BACKUP_DIR}" "${DATE}.sql"
rm -f "${BACKUP_FILE}"

ARCHIVE_SIZE=$(du -h "${ARCHIVE_FILE}" | cut -f1)
log "✅ Backup created: ${ARCHIVE_FILE} (${ARCHIVE_SIZE})"

# ─── Cleanup Old Backups ───────────────────────────────────────────────────
DELETED=$(find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [ "${DELETED}" -gt 0 ]; then
    log "🧹 Cleaned up ${DELETED} old backup(s)"
fi

# ─── Email Backup ──────────────────────────────────────────────────────────
if [ -f "scripts/send-backup-email.js" ]; then
    log "📧 Sending backup via email..."
    node scripts/send-backup-email.js "${ARCHIVE_FILE}" || log "⚠️ Email send failed (non-fatal)"
fi

# ─── Ping Uptime Kuma ──────────────────────────────────────────────────────
if [ -n "${KUMA_PUSH_BACKUP_URL:-}" ]; then
    log "📡 Pinging Uptime Kuma..."
    curl -fsS -m 10 "${KUMA_PUSH_BACKUP_URL}" > /dev/null 2>&1 || log "⚠️ Uptime Kuma ping failed (non-fatal)"
fi

log "🎉 Backup complete!"
