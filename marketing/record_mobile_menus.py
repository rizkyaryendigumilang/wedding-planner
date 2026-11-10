"""
Records the 11 raw Mobile View (iPhone 390x844) live clips for every single menu tab
(`mobile-01-dashboard.mp4` .. `mobile-11-settings.mp4`), 100% clean without touch circles
or IP addresses, and also creates continuous raw tour files (`web-live-tour.mp4` and
`mobile-live-tour.mp4`) for Concat's raw media bin and multi-track timeline.
"""

import shutil
import subprocess
import sys
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from record_live_browser import (
    CHROME,
    CONCAT_ASSETS_DIR,
    FFMPEG,
    PUBLIC_CLIPS_DIR,
    RAW_RECORD_DIR,
    LocalDemoServerHandler,
    ThreadingHTTPServer,
    convert_webm_to_mp4,
    move_and_click,
    setup_auth_storage,
    smooth_scroll,
)

MOBILE_MENUS = [
    ("mobile-01-dashboard", "/"),
    ("mobile-02-itinerary", "/rundown"),
    ("mobile-03-reception", "/reception"),
    ("mobile-04-budget", "/budget"),
    ("mobile-05-gifts", "/gifts"),
    ("mobile-06-guests", "/guests"),
    ("mobile-07-vendors", "/vendors"),
    ("mobile-08-administration", "/administration"),
    ("mobile-09-seserahan", "/seserahan"),
    ("mobile-10-gallery", "/gallery"),
    ("mobile-11-settings", "/settings"),
]


def record_single_mobile_clip(browser, base_url, clip_name, route):
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        record_video_dir=str(RAW_RECORD_DIR),
        record_video_size={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    setup_auth_storage(page, base_url, "light")
    route_suffix = "/" if route == "/" else route
    page.goto(base_url + "/wedding" + route_suffix, wait_until="domcontentloaded")
    page.locator("nav[aria-label='Navigasi utama']").wait_for(state="visible", timeout=8000)
    page.wait_for_timeout(550)

    # Smooth mobile scroll down and back up to show live mobile responsiveness
    smooth_scroll(page, 260, wait_after=700)
    if route == "/budget":
        for txt in ["Sangjit", "Pernikahan"]:
            loc = page.locator(f"button:has-text('{txt}')")
            if loc.count() > 0:
                move_and_click(page, loc, wait_after=450)
    elif route == "/settings":
        for txt in ["Rekening", "Adat"]:
            loc = page.locator(f"button:has-text('{txt}')")
            if loc.count() > 0:
                move_and_click(page, loc, wait_after=450)
    else:
        smooth_scroll(page, 440, wait_after=650)
    smooth_scroll(page, 0, wait_after=500)

    vid_webm = Path(page.video.path())
    ctx.close()

    out_mp4 = PUBLIC_CLIPS_DIR / f"{clip_name}.mp4"
    convert_webm_to_mp4(vid_webm, out_mp4, trim_start=0.35)
    shutil.copy2(out_mp4, CONCAT_ASSETS_DIR / f"{clip_name}.mp4")
    kb = out_mp4.stat().st_size // 1024
    print(f"  OK  {clip_name:26s} -> {kb} KB")


def concat_raw_tour(clip_names, output_name):
    list_file = RAW_RECORD_DIR / f"_{output_name}_list.txt"
    lines = []
    for name in clip_names:
        p = (PUBLIC_CLIPS_DIR / f"{name}.mp4").resolve()
        if p.exists():
            lines.append(f"file '{p.as_posix()}'")
    list_file.write_text("\n".join(lines), encoding="utf-8")
    out_mp4 = CONCAT_ASSETS_DIR / output_name
    subprocess.run(
        [
            str(FFMPEG),
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(list_file),
            "-t",
            "40",
            "-c",
            "copy",
            str(out_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    shutil.copy2(out_mp4, PUBLIC_CLIPS_DIR / output_name)
    print(f"  OK  Continuous Raw Tour: {output_name:24s} -> {out_mp4.stat().st_size // 1024} KB")


def main():
    port = 8132
    server = ThreadingHTTPServer(("127.0.0.1", port), LocalDemoServerHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base_url = f"http://127.0.0.1:{port}"
    print(f"[1/2] Recording 11 raw Mobile iPhone clips on {base_url}...")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME,
            headless=False,
            args=["--disable-infobars", "--window-position=80,40", "--window-size=430,910"],
        )
        for clip_name, route in MOBILE_MENUS:
            record_single_mobile_clip(browser, base_url, clip_name, route)
        browser.close()

    server.shutdown()

    print("[2/2] Building continuous raw Web & Mobile tour MP4 files for Concat...")
    web_names = [
        "web-01-dashboard",
        "web-02-itinerary",
        "web-03-reception",
        "web-04-budget",
        "web-05-gifts",
        "web-06-guests",
        "web-07-vendors",
        "web-08-administration",
        "web-09-seserahan",
        "web-10-gallery",
        "web-11-settings",
    ]
    mob_names = [m[0] for m in MOBILE_MENUS] + ["mobile-12-showcase"]
    concat_raw_tour(web_names, "raw-web-live-tour.mp4")
    concat_raw_tour(mob_names, "raw-mobile-iphone-tour.mp4")
    print("All raw Mobile clips and continuous raw tours ready!")


if __name__ == "__main__":
    main()
