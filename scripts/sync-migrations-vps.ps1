# ==============================================================================
# Script Sinkronisasi Migrasi & OAuth PocketBase ke VPS (PowerShell)
# ==============================================================================
# Penggunaan:
#   .\scripts\sync-migrations-vps.ps1
#   .\scripts\sync-migrations-vps.ps1 -VpsUser "ubuntu" -VpsHost "43.156.236.102"
# ==============================================================================

param(
    [string]$VpsHost = "43.156.236.102",
    [string]$VpsUser = "ubuntu",
    [int]$VpsPort = 22,
    [string]$RemoteDir = "/opt/wedding-planner",
    [string]$SshKey = "$env:USERPROFILE\.ssh\ssh.pem"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Sinkronisasi Migrasi & OAuth PocketBase ke VPS ===" -ForegroundColor Cyan
Write-Host "Target: $VpsUser@$VpsHost:$RemoteDir" -ForegroundColor Gray

if (-not (Test-Path "pb_migrations")) {
    Write-Error "Direktori pb_migrations tidak ditemukan di folder kerja saat ini."
}

$tempArchive = "$env:TEMP\pb_payload.tar.gz"
if (Test-Path $tempArchive) { Remove-Item $tempArchive -Force }

Write-Host "1. Mengemas pb_migrations dan file kredensial lokal..." -ForegroundColor Yellow
$itemsToPack = @("pb_migrations")
if (Test-Path "pb_data\oauth_credentials.json") {
    Write-Host "   pb_data/oauth_credentials.json ditemukan, ikut dikemas..." -ForegroundColor Green
    $itemsToPack += "pb_data/oauth_credentials.json"
}

tar.exe -czf $tempArchive $itemsToPack

Write-Host "2. Mengunggah payload ke VPS via SCP..." -ForegroundColor Yellow
$scpArgs = @("-P", $VpsPort.ToString(), "-o", "StrictHostKeyChecking=no")
if (Test-Path $SshKey) {
    $scpArgs += @("-i", $SshKey)
}
$scpArgs += @($tempArchive, "${VpsUser}@${VpsHost}:/tmp/pb_payload.tar.gz")

& scp.exe @scpArgs
Remove-Item $tempArchive -Force

Write-Host "3. Mengekstrak dan me-restart PocketBase di VPS..." -ForegroundColor Yellow
$remoteBash = @"
set -euo pipefail
target_dir='$RemoteDir'

if [ ! -d "`$target_dir" ]; then
  if [ -d "/srv/wedding-planner" ]; then target_dir="/srv/wedding-planner"
  elif [ -d "/srv/wedding-planner-pb" ]; then target_dir="/srv/wedding-planner-pb"
  elif [ -d "/var/www/pocketbase" ]; then target_dir="/var/www/pocketbase"
  fi
fi

mkdir -p "`$target_dir/pb_migrations" "`$target_dir/pb_data"
tar -xzf /tmp/pb_payload.tar.gz -C "`$target_dir"
rm -f /tmp/pb_payload.tar.gz

if [ -f "`$target_dir/pb_data/oauth_credentials.json" ]; then
  chmod 600 "`$target_dir/pb_data/oauth_credentials.json"
fi

SUDO_CMD=""
if [ "`$(id -u)" -ne 0 ]; then SUDO_CMD="sudo"; fi

if systemctl is-active --quiet wedding-planner-pocketbase; then
  `$SUDO_CMD systemctl restart wedding-planner-pocketbase
  echo "Layanan wedding-planner-pocketbase telah direstart."
elif systemctl is-active --quiet pocketbase; then
  `$SUDO_CMD systemctl restart pocketbase
  echo "Layanan pocketbase telah direstart."
elif systemctl is-active --quiet wedding-planner-pb; then
  `$SUDO_CMD systemctl restart wedding-planner-pb
  echo "Layanan wedding-planner-pb telah direstart."
fi
"@

$sshArgs = @("-p", $VpsPort.ToString(), "-o", "StrictHostKeyChecking=no")
if (Test-Path $SshKey) {
    $sshArgs += @("-i", $SshKey)
}
$sshArgs += @("${VpsUser}@${VpsHost}", $remoteBash)

& ssh.exe @sshArgs

Write-Host "=== Sinkronisasi Berhasil Selesai! ===" -ForegroundColor Green
