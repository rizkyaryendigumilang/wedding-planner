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
    [int]$VpsPort = 2222,
    [string]$RemoteDir = "/home/ubuntu/platform-repos/wedding-planner",
    [string]$SshKey = ""
)

$ErrorActionPreference = "Stop"

Write-Host "=== Sinkronisasi Migrasi & OAuth PocketBase ke VPS ===" -ForegroundColor Cyan
Write-Host "Target Host : $VpsUser@${VpsHost}:$VpsPort" -ForegroundColor Gray
Write-Host "Direktori   : $RemoteDir" -ForegroundColor Gray

# Cari file SSH Key otomatis jika tidak diberikan
$keyCandidates = @(
    $SshKey,
    "$env:USERPROFILE\Downloads\ssh.pem",
    "$env:USERPROFILE\.ssh\ssh.pem",
    "$PSScriptRoot\..\ssh.pem",
    "ssh.pem"
)

$resolvedKey = ""
foreach ($cand in $keyCandidates) {
    if (-not [string]::IsNullOrWhiteSpace($cand) -and (Test-Path $cand)) {
        $resolvedKey = (Resolve-Path $cand).Path
        break
    }
}

if (-not [string]::IsNullOrWhiteSpace($resolvedKey)) {
    Write-Host "SSH Key     : $resolvedKey" -ForegroundColor Gray
}

if (-not (Test-Path "pb_migrations")) {
    Write-Error "Direktori pb_migrations tidak ditemukan di folder kerja saat ini."
}

$tempArchive = "$env:TEMP\pb_payload.tar.gz"
$tempScript  = "$env:TEMP\vps_apply.sh"
if (Test-Path $tempArchive) { Remove-Item $tempArchive -Force }
if (Test-Path $tempScript)  { Remove-Item $tempScript -Force }

Write-Host "`n1. Mengemas pb_migrations dan file kredensial lokal..." -ForegroundColor Yellow
$itemsToPack = @("pb_migrations")
if (Test-Path "pb_data\oauth_credentials.json") {
    Write-Host "   pb_data/oauth_credentials.json ditemukan, ikut dikemas..." -ForegroundColor Green
    $itemsToPack += "pb_data\oauth_credentials.json"
}

tar.exe -czf $tempArchive @itemsToPack

# Buat script bash remote (bebas dari masalah quote-escaping PowerShell)
$remoteScriptContent = @'
#!/usr/bin/env bash
set -euo pipefail
target_dir="$1"

if [ ! -d "$target_dir" ]; then
  if [ -d "/home/ubuntu/platform-repos/wedding-planner" ]; then target_dir="/home/ubuntu/platform-repos/wedding-planner"
  elif [ -d "/opt/wedding-planner" ]; then target_dir="/opt/wedding-planner"
  elif [ -d "/srv/wedding-planner" ]; then target_dir="/srv/wedding-planner"
  fi
fi

echo "-> Mengekstrak ke $target_dir ..."
sudo mkdir -p "$target_dir/pb_migrations" "$target_dir/pb_data"
sudo tar -xzf /tmp/pb_payload.tar.gz -C "$target_dir"
rm -f /tmp/pb_payload.tar.gz

if [ -f "$target_dir/pb_data/oauth_credentials.json" ]; then
  sudo chown ubuntu:ubuntu "$target_dir/pb_data/oauth_credentials.json" || true
  sudo chmod 600 "$target_dir/pb_data/oauth_credentials.json"
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
  echo "-> Status: Layanan wedding-planner-pocketbase telah direstart dan aktif."
elif sudo systemctl is-active --quiet pocketbase; then
  sudo systemctl restart pocketbase
  echo "-> Status: Layanan pocketbase telah direstart dan aktif."
fi

echo "-> Memverifikasi provider OAuth aktif:"
curl -s http://127.0.0.1:8090/api/collections/users/auth-methods | grep -o '"name":"[^"]*"' || true
rm -f /tmp/vps_apply.sh
'@

[System.IO.File]::WriteAllText($tempScript, $remoteScriptContent.Replace("`r`n", "`n"), (New-Object System.Text.UTF8Encoding($false)))

Write-Host "2. Mengunggah payload ke VPS via SCP..." -ForegroundColor Yellow
$scpArgs = @("-P", $VpsPort.ToString(), "-o", "StrictHostKeyChecking=no")
if (-not [string]::IsNullOrWhiteSpace($resolvedKey)) {
    $scpArgs += @("-i", $resolvedKey)
}
$scpArgs += @($tempArchive, $tempScript, "${VpsUser}@${VpsHost}:/tmp/")

& scp.exe @scpArgs
if ($LASTEXITCODE -ne 0) {
    throw "Gagal mengunggah payload ke VPS via SCP."
}
Remove-Item $tempArchive -Force
Remove-Item $tempScript -Force

Write-Host "3. Mengekstrak, menjalankan migrate up, dan me-restart PocketBase di VPS..." -ForegroundColor Yellow
$sshArgs = @("-p", $VpsPort.ToString(), "-o", "StrictHostKeyChecking=no")
if (-not [string]::IsNullOrWhiteSpace($resolvedKey)) {
    $sshArgs += @("-i", $resolvedKey)
}
$sshArgs += @("${VpsUser}@${VpsHost}", "bash /tmp/vps_apply.sh '$RemoteDir'")

& ssh.exe @sshArgs
if ($LASTEXITCODE -ne 0) {
    throw "Gagal mengeksekusi instruksi remote di VPS via SSH."
}

Write-Host "`n=== Sinkronisasi Berhasil Selesai! ===" -ForegroundColor Green
