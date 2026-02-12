#!/bin/bash
# =============================================================================
# MF-Investments — Database Restore Script
# =============================================================================
# Restores a database backup created by backup-db.sh.
#
# Usage:
#   ./scripts/restore-db.sh ./backups/daily/2026-02-12.tar.gz
#
# WARNING: This will OVERWRITE the specified tables in the database.
# =============================================================================

set -euo pipefail

ARCHIVE_FILE="$1"
COMPOSE_FILE="docker-compose.vps.yml"
TIMESTAMP=$(date +%Y-%m-%d_%H:%M:%S)

# Load environment variables from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# ─── Helpers ─────────────────────────────────────────────────────────────────
log() {
    echo "[${TIMESTAMP}] $1"
}

error_exit() {
    log "❌ ERROR: $1"
    exit 1
}

# ─── Validate Input ─────────────────────────────────────────────────────────
if [ -z "${ARCHIVE_FILE:-}" ]; then
    echo "Usage: $0 <path-to-backup.tar.gz>"
    echo "Example: $0 ./backups/daily/2026-02-12.tar.gz"
    exit 1
fi

if [ ! -f "${ARCHIVE_FILE}" ]; then
    error_exit "File not found: ${ARCHIVE_FILE}"
fi

# Fall back to default compose file if VPS compose doesn't exist
if [ ! -f "${COMPOSE_FILE}" ]; then
    COMPOSE_FILE="docker-compose.yml"
    if [ ! -f "${COMPOSE_FILE}" ]; then
        error_exit "No docker-compose file found"
    fi
fi

# ─── Confirmation ───────────────────────────────────────────────────────────
log "⚠️  WARNING: This will restore from: ${ARCHIVE_FILE}"
log "⚠️  This will OVERWRITE existing data in the following tables:"
log "    users, demo_accounts, holdings, transactions, ledger_entries, funds"
echo ""
read -p "Are you sure? Type 'yes' to continue: " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    log "❌ Restore cancelled."
    exit 0
fi

# ─── Extract ────────────────────────────────────────────────────────────────
TEMP_DIR=$(mktemp -d)
log "📦 Extracting to ${TEMP_DIR}..."
tar -xzf "${ARCHIVE_FILE}" -C "${TEMP_DIR}"

# Find the SQL file
SQL_FILE=$(find "${TEMP_DIR}" -name "*.sql" | head -1)

if [ -z "${SQL_FILE}" ] || [ ! -s "${SQL_FILE}" ]; then
    rm -rf "${TEMP_DIR}"
    error_exit "No SQL file found in archive"
fi

SQL_SIZE=$(du -h "${SQL_FILE}" | cut -f1)
log "📄 Found SQL dump: $(basename ${SQL_FILE}) (${SQL_SIZE})"

# ─── Restore ────────────────────────────────────────────────────────────────
log "🔄 Restoring database..."

docker compose -f "${COMPOSE_FILE}" exec -T mysql mysql \
    -u"${DB_USER:-mf_user}" \
    -p"${DB_PASSWORD:-mf_password}" \
    "${DB_NAME:-mf_selection}" < "${SQL_FILE}" \
    || error_exit "mysql import failed"

# ─── Cleanup ────────────────────────────────────────────────────────────────
rm -rf "${TEMP_DIR}"

# ─── Verify ─────────────────────────────────────────────────────────────────
log "📊 Post-restore row counts:"
TABLES="users demo_accounts holdings transactions ledger_entries funds"
for TABLE in ${TABLES}; do
    COUNT=$(docker compose -f "${COMPOSE_FILE}" exec -T mysql mysql \
        -u"${DB_USER:-mf_user}" \
        -p"${DB_PASSWORD:-mf_password}" \
        -N -e "SELECT COUNT(*) FROM ${TABLE}" \
        "${DB_NAME:-mf_selection}" 2>/dev/null || echo "?")
    log "   ${TABLE}: ${COUNT} rows"
done

log "✅ Restore complete from: ${ARCHIVE_FILE}"
