#!/usr/bin/env bash
# ==============================================================================
# Script Sinkronisasi Migrasi PocketBase ke VPS
# ==============================================================================
# Mengunggah seluruh skema di pb_migrations/ ke server PocketBase VPS
# dan memastikan migrasi baru dieksekusi dengan aman tanpa perlu Admin UI manual.
#
# Penggunaan:
#   ./scripts/sync-migrations-vps.sh
#   Atau:
#   VPS_HOST=43.156.236.102 VPS_USER=ubuntu ./scripts/sync-migrations-vps.sh
# ==============================================================================

set -euo pipefail

VPS_HOST="${VPS_HOST:-43.156.236.102}"
VPS_USER="${VPS_USER:-ubuntu}"
VPS_PORT="${VPS_PORT:-2222}"
REMOTE_PB_DIR="${REMOTE_PB_DIR:-/home/ubuntu/platform-repos/wedding-planner}"

# 1. Cari path ssh.pem otomatis di berbagai kemungkinan lingkungan (Git Bash, WSL, Linux, Mac)
SSH_KEY_FOUND=""
for candidate in \
  "${SSH_KEY:-}" \
  "$HOME/Downloads/ssh.pem" \
  "/mnt/c/Users/rizky/Downloads/ssh.pem" \
  "/c/Users/rizky/Downloads/ssh.pem" \
  "C:/Users/rizky/Downloads/ssh.pem" \
  "../ssh.pem" \
  "./ssh.pem"
do
  if [ -n "$candidate" ] && [ -f "$candidate" ]; then
    SSH_KEY_FOUND="$candidate"
    break
  fi
done

SSH_IDENTITY_ARG=""
if [ -n "$SSH_KEY_FOUND" ]; then
  mkdir -p "$HOME/.ssh"
  SAFE_KEY="$HOME/.ssh/wedding_deploy_key.pem"
  cp -f "$SSH_KEY_FOUND" "$SAFE_KEY"
  chmod 600 "$SAFE_KEY"
  SSH_IDENTITY_ARG="-i $SAFE_KEY"
fi

SSH_CMD="ssh -p $VPS_PORT -o StrictHostKeyChecking=no $SSH_IDENTITY_ARG"
SCP_CMD="scp -P $VPS_PORT -o StrictHostKeyChecking=no $SSH_IDENTITY_ARG"

echo "=== Sinkronisasi Migrasi PocketBase ke VPS ==="
echo "Target Host : $VPS_USER@$VPS_HOST:$VPS_PORT"
echo "Direktori   : $REMOTE_PB_DIR"

if [ ! -d "pb_migrations" ]; then
  echo "Error: Direktori pb_migrations tidak ditemukan di lokal!"
  exit 1
fi

# 2. Sinkronkan kredensial OAuth lokal terlindungi jika tersedia
if [ -f "pb_data/oauth_credentials.json" ]; then
  echo "1. Mengunggah pb_data/oauth_credentials.json..."
  $SCP_CMD "pb_data/oauth_credentials.json" "$VPS_USER@$VPS_HOST:/tmp/oauth_credentials.json"
fi

echo "2. Mengemas skema pb_migrations/ lokal..."
tar -czf pb_migrations.tar.gz pb_migrations/

echo "3. Mengunggah pb_migrations.tar.gz ke VPS..."
$SCP_CMD pb_migrations.tar.gz "$VPS_USER@$VPS_HOST:/tmp/pb_migrations.tar.gz"
rm -f pb_migrations.tar.gz

echo "4. Mengekstrak, menjalankan migrate up, dan merestart service di VPS..."
$SSH_CMD "$VPS_USER@$VPS_HOST" "bash -s -- '$REMOTE_PB_DIR'" << 'EOF'
set -euo pipefail
target_dir="$1"

if [ ! -d "$target_dir" ]; then
  echo "Direktori $target_dir tidak ditemukan, mencoba mencari direktori alternatif..."
  if [ -d "/home/ubuntu/platform-repos/wedding-planner" ]; then
    target_dir="/home/ubuntu/platform-repos/wedding-planner"
  elif [ -d "/opt/wedding-planner" ]; then
    target_dir="/opt/wedding-planner"
  elif [ -d "/srv/wedding-planner" ]; then
    target_dir="/srv/wedding-planner"
  fi
fi

echo "-> Mengekstrak migrasi ke: $target_dir/pb_migrations ..."
sudo mkdir -p "$target_dir/pb_migrations"
sudo tar -xzf /tmp/pb_migrations.tar.gz -C "$target_dir"
rm -f /tmp/pb_migrations.tar.gz

if [ -f "/tmp/oauth_credentials.json" ]; then
  echo "-> Memasang kredensial OAuth terlindungi ke $target_dir/pb_data/oauth_credentials.json ..."
  sudo cp /tmp/oauth_credentials.json "$target_dir/pb_data/oauth_credentials.json"
  sudo chown ubuntu:ubuntu "$target_dir/pb_data/oauth_credentials.json" || true
  sudo chmod 600 "$target_dir/pb_data/oauth_credentials.json"
  rm -f /tmp/oauth_credentials.json
fi

sudo chown -R ubuntu:ubuntu "$target_dir/pb_migrations" || true

PB_BIN=""
if [ -x "/home/ubuntu/tmp/pocketbase-check/pocketbase" ]; then
  PB_BIN="/home/ubuntu/tmp/pocketbase-check/pocketbase"
elif [ -x "$target_dir/pocketbase" ]; then
  PB_BIN="$target_dir/pocketbase"
elif command -v pocketbase >/dev/null 2>&1; then
  PB_BIN="$(command -v pocketbase)"
fi

if [ -n "$PB_BIN" ]; then
  echo "-> Menjalankan migrate up dengan $PB_BIN ..."
  sudo -u ubuntu "$PB_BIN" --dir="$target_dir/pb_data" --migrationsDir="$target_dir/pb_migrations" migrate up || true
fi

echo "-> Me-restart layanan wedding-planner-pocketbase systemd..."
if sudo systemctl is-active --quiet wedding-planner-pocketbase; then
  sudo systemctl restart wedding-planner-pocketbase
  echo "-> Status: wedding-planner-pocketbase aktif dan berjalan."
fi

echo "-> Memverifikasi status OAuth providers di server:"
curl -s http://127.0.0.1:8090/api/collections/users/auth-methods | grep -o '"name":"[^"]*"' || true
EOF

echo "=== Sinkronisasi Migrasi Selesai & Sukses! ==="
