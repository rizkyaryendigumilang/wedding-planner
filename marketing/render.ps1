# Render semua materi Instagram dari slide.html memakai Chrome headless.
# Hasil mentah (2x) ada di out/_raw, hasil akhir 1080-lebar ada di out/.

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$raw = Join-Path $root "out\_raw"
$base = "http://127.0.0.1:8126/m/slide.html"

New-Item -ItemType Directory -Force -Path $raw | Out-Null

$jobs = @(
  @{ name = "ig-01-cover";      n = 1; fmt = "portrait"; w = 1080; h = 1350 },
  @{ name = "ig-02-dasbor";     n = 2; fmt = "portrait"; w = 1080; h = 1350 },
  @{ name = "ig-03-anggaran";   n = 3; fmt = "portrait"; w = 1080; h = 1350 },
  @{ name = "ig-04-tamu";       n = 4; fmt = "portrait"; w = 1080; h = 1350 },
  @{ name = "ig-05-vendor";     n = 5; fmt = "portrait"; w = 1080; h = 1350 },
  @{ name = "ig-06-seserahan";  n = 6; fmt = "portrait"; w = 1080; h = 1350 },
  @{ name = "ig-07-cta";        n = 7; fmt = "portrait"; w = 1080; h = 1350 },
  @{ name = "story-01-cover";   n = 1; fmt = "story";    w = 1080; h = 1920 },
  @{ name = "square-01-cover";  n = 1; fmt = "square";   w = 1080; h = 1080 }
)

foreach ($j in $jobs) {
  $out = Join-Path $raw ($j.name + ".png")
  if (Test-Path $out) { Remove-Item $out -Force }
  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $url = "$base`?n=$($j.n)&fmt=$($j.fmt)&imgv=$stamp"
  & $chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars `
    --force-device-scale-factor=2 `
    "--window-size=$($j.w),$($j.h)" `
    --virtual-time-budget=12000 `
    "--screenshot=$out" $url 2>&1 | Out-Null
  if (Test-Path $out) {
    Write-Host ("ok   " + $j.name)
  } else {
    Write-Host ("FAIL " + $j.name)
  }
}
