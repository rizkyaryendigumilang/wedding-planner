#!/usr/bin/env bash
# ==============================================================================
# Script Sinkronisasi Migrasi & Kredensial PocketBase ke VPS
# ==============================================================================
# Mengunggah skema di pb_migrations/ dan kredensial aman di pb_data/oauth_credentials.json
# ke server PocketBase VPS, lalu me-restart service agar migrasi dieksekusi otomatis.
#
# Penggunaan:
#   VPS_HOST=43.156.236.102 VPS_USER=ubuntu ./scripts/sync-migrations-vps.sh
# ==============================================================================

set -euo pipefail

VPS_HOST="${VPS_HOST:-43.156.236.102}"
VPS_USER="${VPS_USER:-ubuntu}"
VPS_PORT="${VPS_PORT:-22}"
REMOTE_PB_DIR="${REMOTE_PB_DIR:-/opt/wedding-planner}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/ssh.pem}"

SSH_OPTS=("-p" "$VPS_PORT")
SCP_OPTS=("-P" "$VPS_PORT")

if [ -f "$SSH_KEY" ]; then
  SSH_OPTS+=("-i" "$SSH_KEY")
  SCP_OPTS+=("-i" "$SSH_KEY")
fi

echo "=== Sinkronisasi Migrasi & OAuth PocketBase ke VPS ==="
echo "Target: $VPS_USER@$VPS_HOST:$REMOTE_PB_DIR"

if [ ! -d "pb_migrations" ]; then
  echo "Error: Direktori pb_migrations tidak ditemukan di lokal!"
  exit 1
fi

PAYLOAD_ITEMS=("pb_migrations")
if [ -f "pb_data/oauth_credentials.json" ]; then
  echo "File pb_data/oauth_credentials.json ditemukan, ikut dikemas..."
  PAYLOAD_ITEMS+=("pb_data/oauth_credentials.json")
fi

echo "1. Mengemas file ke arsip payload..."
tar -czf /tmp/pb_payload.tar.gz "${PAYLOAD_ITEMS[@]}"

echo "2. Mengunggah payload ke VPS..."
scp "${SCP_OPTS[@]}" /tmp/pb_payload.tar.gz "$VPS_USER@$VPS_HOST:/tmp/pb_payload.tar.gz"
rm -f /tmp/pb_payload.tar.gz

echo "3. Mengekstrak dan menerapkan migrasi di VPS..."
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" "bash -s -- '$REMOTE_PB_DIR'" << 'EOF'
set -euo pipefail
target_dir="$1"

if [ ! -d "$target_dir" ]; then
  echo "Direktori $target_dir tidak ditemukan, mencoba mencari direktori PocketBase alternatif..."
  if [ -d "/srv/wedding-planner" ]; then
    target_dir="/srv/wedding-planner"
  elif [ -d "/srv/wedding-planner-pb" ]; then
    target_dir="/srv/wedding-planner-pb"
  elif [ -d "/var/www/pocketbase" ]; then
    target_dir="/var/www/pocketbase"
  fi
fi

echo "Mengekstrak ke: $target_dir ..."
mkdir -p "$target_dir/pb_migrations" "$target_dir/pb_data"
tar -xzf /tmp/pb_payload.tar.gz -C "$target_dir"
rm -f /tmp/pb_payload.tar.gz

if [ -f "$target_dir/pb_data/oauth_credentials.json" ]; then
  chmod 600 "$target_dir/pb_data/oauth_credentials.json"
  echo "File kredensial OAuth diamankan (chmod 600)."
fi

echo "Daftar migrasi aktif di server:"
ls -la "$target_dir/pb_migrations"

SUDO_CMD=""
if [ "$(id -u)" -ne 0 ]; then
  SUDO_CMD="sudo"
fi

# Cek layanan PocketBase di systemd dan restart
if systemctl is-active --quiet wedding-planner-pocketbase; then
  echo "Me-restart layanan wedding-planner-pocketbase..."
  $SUDO_CMD systemctl restart wedding-planner-pocketbase
  echo "Status: Layanan wedding-planner-pocketbase telah direstart."
elif systemctl is-active --quiet pocketbase; then
  echo "Me-restart layanan pocketbase..."
  $SUDO_CMD systemctl restart pocketbase
  echo "Status: Layanan pocketbase telah direstart."
elif systemctl is-active --quiet wedding-planner-pb; then
  echo "Me-restart layanan wedding-planner-pb..."
  $SUDO_CMD systemctl restart wedding-planner-pb
  echo "Status: Layanan wedding-planner-pb telah direstart."
else
  echo "Catatan: Service systemd tidak terdeteksi otomatis."
  echo "Silakan jalankan restart manual atau jalankan migrasi via PocketBase CLI."
fi
EOF

echo "=== Sinkronisasi Berhasil Selesai! ==="
