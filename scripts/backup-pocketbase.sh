#!/usr/bin/env bash
# ==============================================================================
# Script Cadangan Otomatis & Rotasi PocketBase (Wedding Planner)
# ==============================================================================
# Dijalankan secara berkala melalui cron (misal: setiap hari pkl 02:00 pagi).
# Menyimpan snapshot database SQLite (aman dari korupsi saat PB aktif)
# dan folder storage file/foto ke dalam arsip tar.gz terkompresi.
#
# Penggunaan:
#   chmod +x scripts/backup-pocketbase.sh
#   ./scripts/backup-pocketbase.sh
# ==============================================================================

set -euo pipefail

# --- Konfigurasi Default (Dapat ditimpa via Environment Variable) ---
APP_DIR="${APP_DIR:-/opt/wedding-planner}"
PB_DATA_DIR="${PB_DATA_DIR:-$APP_DIR/pb_data}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups/wedding-planner}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DATE_TAG=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="pocketbase_backup_${DATE_TAG}.tar.gz"
TEMP_DIR="/tmp/pb_backup_${DATE_TAG}"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# 1. Validasi direktori sumber
if [[ ! -d "$PB_DATA_DIR" ]]; then
  log "ERROR: Direktori pb_data tidak ditemukan di: $PB_DATA_DIR"
  exit 1
fi

# 2. Buat direktori tujuan & temporary
mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"

log "Memulai pencadangan PocketBase..."
log "Sumber: $PB_DATA_DIR"
log "Tujuan: $BACKUP_DIR/$ARCHIVE_NAME"

# 3. Ambil snapshot SQLite secara aman (mencegah korupsi WAL SQLite saat running)
DB_FILE="$PB_DATA_DIR/data.db"
if [[ -f "$DB_FILE" ]]; then
  if command -v sqlite3 >/dev/null 2>&1; then
    log "Menggunakan sqlite3 online backup API..."
    sqlite3 "$DB_FILE" ".backup '$TEMP_DIR/data.db'"
  else
    log "PERINGATAN: sqlite3 CLI tidak terpasang. Menggunakan salinan berkas langsung..."
    cp -a "$DB_FILE" "$TEMP_DIR/data.db"
    [[ -f "$DB_FILE-wal" ]] && cp -a "$DB_FILE-wal" "$TEMP_DIR/data.db-wal"
    [[ -f "$DB_FILE-shm" ]] && cp -a "$DB_FILE-shm" "$TEMP_DIR/data.db-shm"
  fi
fi

# 4. Salin folder storage (berkas gambar/foto gallery) jika ada
if [[ -d "$PB_DATA_DIR/storage" ]]; then
  log "Menyalin folder uploads/storage..."
  cp -a "$PB_DATA_DIR/storage" "$TEMP_DIR/storage"
fi

# 5. Salin pb_migrations (jika ada) untuk menjaga konsistensi skema
if [[ -d "$APP_DIR/pb_migrations" ]]; then
  cp -a "$APP_DIR/pb_migrations" "$TEMP_DIR/pb_migrations"
fi

# 6. Kompresi arsip tar.gz
log "Mengompresi berkas cadangan ke tar.gz..."
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" -C "$TEMP_DIR" .

# 7. Bersihkan direktori temporary
rm -rf "$TEMP_DIR"

BACKUP_SIZE=$(du -sh "$BACKUP_DIR/$ARCHIVE_NAME" | cut -f1)
log "Pencadangan berhasil! Ukuran arsip: $BACKUP_SIZE"

# 8. Rotasi: Hapus cadangan lama yang melebihi batas retensi
log "Membersihkan cadangan lama (> $RETENTION_DAYS hari)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "pocketbase_backup_*.tar.gz" -mtime +"$RETENTION_DAYS" -print -delete | wc -l)
log "Rotasi selesai. $DELETED_COUNT arsip lama dihapus."

log "Status: SUKSES (Cadangan tersimpan di $BACKUP_DIR/$ARCHIVE_NAME)"
