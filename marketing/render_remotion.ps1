# Render seluruh foto Carousel Instagram (4:5, 9:16, 1:1) dan Video Overview (9:16 Reels & 4:5 Feed)
# menggunakan Remotion dari marketing/remotion/index.js

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Split-Path -Parent $root
$outDir = Join-Path $root "out"

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Set-Location $project

$stills = @(
  "ig-01-cover",
  "ig-02-dasbor",
  "ig-03-anggaran",
  "ig-04-tamu",
  "ig-05-resepsi",
  "ig-06-rundown",
  "ig-07-vendor",
  "ig-08-admin-seserahan",
  "ig-09-kado-privasi",
  "ig-10-cta",
  "story-01-cover",
  "story-10-cta",
  "square-01-cover"
)

Write-Host "=== [1/2] Rendering 13 Instagram Stills via Remotion ==="
foreach ($id in $stills) {
  $outFile = Join-Path $outDir "$id.png"
  npx remotion still marketing/remotion/index.js $id $outFile --quiet
  if (Test-Path $outFile) {
    $kb = [math]::Round((Get-Item $outFile).Length / 1KB)
    Write-Host "  OK  $id.png ($kb KB)"
  } else {
    Write-Host "  ERR $id.png"
  }
}

Write-Host "=== [2/2] Rendering Instagram Reels (9:16) & Feed (4:5) Videos via Remotion ==="
$reelsOut = Join-Path $outDir "overview-reels-9x16.mp4"
npx remotion render marketing/remotion/index.js OverviewReels $reelsOut --codec=h264 --quiet
if (Test-Path $reelsOut) {
  $mb = [math]::Round((Get-Item $reelsOut).Length / 1MB, 2)
  Write-Host "  OK  overview-reels-9x16.mp4 ($mb MB)"
}

$feedOut = Join-Path $outDir "overview-feed-4x5.mp4"
npx remotion render marketing/remotion/index.js OverviewFeed $feedOut --codec=h264 --quiet
if (Test-Path $feedOut) {
  $mb = [math]::Round((Get-Item $feedOut).Length / 1MB, 2)
  Write-Host "  OK  overview-feed-4x5.mp4 ($mb MB)"
}
