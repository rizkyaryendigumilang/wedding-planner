#!/usr/bin/env bash
# ==============================================================================
# Script Sinkronisasi Migrasi PocketBase ke VPS
# ==============================================================================
# Mengunggah seluruh skema di pb_migrations/ ke server PocketBase VPS
# dan memastikan migrasi baru dieksekusi dengan aman.
#
# Penggunaan:
#   VPS_HOST=43.156.236.102 VPS_USER=root ./scripts/sync-migrations-vps.sh
# ==============================================================================

set -euo pipefail

VPS_HOST="${VPS_HOST:-43.156.236.102}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
REMOTE_PB_DIR="${REMOTE_PB_DIR:-/opt/wedding-planner}"

echo "=== Sinkronisasi Migrasi PocketBase ke VPS ==="
echo "Target: $VPS_USER@$VPS_HOST:$REMOTE_PB_DIR"

if [ ! -d "pb_migrations" ]; then
  echo "Error: Direktori pb_migrations tidak ditemukan di lokal!"
  exit 1
fi

echo "1. Mengemas pb_migrations/ lokal..."
tar -czf /tmp/pb_migrations.tar.gz pb_migrations/

echo "2. Mengunggah ke VPS..."
scp -P "$VPS_PORT" /tmp/pb_migrations.tar.gz "$VPS_USER@$VPS_HOST:/tmp/pb_migrations.tar.gz"

echo "3. Mengekstrak dan menerapkan migrasi di VPS..."
ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "bash -s -- '$REMOTE_PB_DIR'" << 'EOF'
set -euo pipefail
target_dir="$1"

if [ ! -d "$target_dir" ]; then
  echo "Direktori $target_dir tidak ditemukan, mencoba mencari direktori PocketBase alternatif..."
  if [ -d "/srv/wedding-planner" ]; then
    target_dir="/srv/wedding-planner"
  elif [ -d "/var/www/pocketbase" ]; then
    target_dir="/var/www/pocketbase"
  fi
fi

echo "Mengekstrak migrasi ke: $target_dir/pb_migrations ..."
mkdir -p "$target_dir/pb_migrations"
tar -xzf /tmp/pb_migrations.tar.gz -C "$target_dir"
rm -f /tmp/pb_migrations.tar.gz

echo "Daftar migrasi aktif di server:"
ls -la "$target_dir/pb_migrations"

# Cek apakah PocketBase berjalan via systemd
if systemctl is-active --quiet wedding-planner-pocketbase; then
  echo "Me-restart layanan wedding-planner-pocketbase systemd agar migrasi otomatis dieksekusi..."
  systemctl restart wedding-planner-pocketbase
  echo "Status: Layanan wedding-planner-pocketbase telah direstart."
elif systemctl is-active --quiet pocketbase; then
  echo "Me-restart layanan PocketBase systemd agar migrasi otomatis dieksekusi..."
  systemctl restart pocketbase
  echo "Status: Layanan PocketBase telah direstart."
elif systemctl is-active --quiet wedding-planner-pb; then
  echo "Me-restart layanan wedding-planner-pb telah direstart."
  systemctl restart wedding-planner-pb
  echo "Status: Layanan wedding-planner-pb telah direstart."
else
  echo "Catatan: Layanan PocketBase tidak terdeteksi di systemctl."
  echo "Silakan jalankan ./pocketbase migrate up atau restart proses PocketBase Anda."
fi
EOF

rm -f /tmp/pb_migrations.tar.gz
echo "=== Sinkronisasi Migrasi Selesai! ==="
