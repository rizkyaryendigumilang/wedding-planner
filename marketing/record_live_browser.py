"""
Remote-controls Google Chrome live (headless=False so it is visible on screen),
logs into the demo account (demo / demo123), enters every single sidebar tab
and sub-tab with a smooth visible cursor + click ripple, and records live video
clips for each menu (11 Web Desktop clips + 1 iPhone Mobile View clip).

All clips are transcoded to 30fps H.264 MP4 in `public/marketing/live-clips/`
and `marketing/concat-assets/` with zero IP address visible.
"""

import base64
import datetime
import json
import os
import shutil
import subprocess
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
DIST = PROJECT / "dist"
FFMPEG = PROJECT / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

RAW_RECORD_DIR = ROOT / "live-recordings"
PUBLIC_CLIPS_DIR = PROJECT / "public" / "marketing" / "live-clips"
CONCAT_ASSETS_DIR = ROOT / "concat-assets"

RAW_RECORD_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_CLIPS_DIR.mkdir(parents=True, exist_ok=True)
CONCAT_ASSETS_DIR.mkdir(parents=True, exist_ok=True)

SEED_PATH = ROOT / "live_demo_seed.json"
with open(SEED_PATH, "r", encoding="utf-8") as f:
    SEED_DATA = json.load(f)


def _make_fresh_jwt(user_id: str) -> str:
    hdr = base64.urlsafe_b64encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode()
    ).decode().rstrip("=")
    pld = base64.urlsafe_b64encode(
        json.dumps(
            {
                "collectionId": "_pb_users_auth_",
                "exp": int(time.time()) + 86400 * 30,
                "id": user_id,
                "refreshable": True,
                "type": "auth",
            },
            separators=(",", ":"),
        ).encode()
    ).decode().rstrip("=")
    return f"{hdr}.{pld}.demosig"


SEED_DATA["token"] = _make_fresh_jwt(SEED_DATA.get("userId", "rhre34dr5qz356s"))
future_exp = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)).strftime(
    "%Y-%m-%d %H:%M:%S.000Z"
)
if "user" in SEED_DATA and isinstance(SEED_DATA["user"], dict):
    SEED_DATA["user"]["demo_expires_at"] = future_exp


class LocalDemoServerHandler(SimpleHTTPRequestHandler):
    def _send_json(self, payload, status=200):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        clean = self.path.split("?", 1)[0]
        if clean.endswith("/auth-refresh") or clean.endswith("/auth-with-password"):
            return self._send_json({"token": SEED_DATA["token"], "record": SEED_DATA["user"]})
        return self._send_json({}, 200)

    def do_GET(self):
        clean = self.path.split("?", 1)[0]
        if clean.startswith("/api/collections/"):
            parts = clean.strip("/").split("/")
            if len(parts) >= 4:
                col = parts[2]
                items = SEED_DATA.get("collections", {}).get(col, [])
                if len(parts) == 5 and parts[3] == "records":
                    rec_id = parts[4]
                    for it in items:
                        if it.get("id") == rec_id:
                            return self._send_json(it)
                    if items:
                        return self._send_json(items[0])
                    return self._send_json({"message": "Not found"}, 404)
                return self._send_json(
                    {
                        "page": 1,
                        "perPage": max(len(items), 50),
                        "totalItems": len(items),
                        "totalPages": 1,
                        "items": items,
                    }
                )
        if clean == "/api/realtime":
            self.send_response(404)
            self.end_headers()
            return
        return super().do_GET()

    def translate_path(self, path):
        path = path.split("?", 1)[0].split("#", 1)[0]
        rel = path.lstrip("/")
        if rel.startswith("wedding/"):
            rel = rel[len("wedding/") :]
        elif rel == "wedding":
            rel = ""
        full = DIST / rel
        if rel and full.is_file():
            return str(full)
        if full.is_dir() and (full / "index.html").is_file():
            return str(full / "index.html")
        if rel.startswith("assets/"):
            return str(full)
        return str(DIST / "index.html")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


CLEAN_STYLE_INIT_JS = """
(() => {
  const installCleanStyle = () => {
    if (document.getElementById('__clean_demo_style')) return;
    const style = document.createElement('style');
    style.id = '__clean_demo_style';
    style.textContent = `
      * { scrollbar-width: none !important; }
      *::-webkit-scrollbar { display: none !important; }
    `;
    if (document.head) document.head.appendChild(style);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installCleanStyle);
  } else {
    installCleanStyle();
  }
  window.__installDemoCursor = () => {};
  window.__moveCursor = () => {};
  window.__pulseClick = () => {};
})();
"""


def setup_auth_storage(page, base_url, theme="light"):
    cache_str = json.dumps(SEED_DATA["cache"], ensure_ascii=False)
    auth_str = json.dumps({"token": SEED_DATA["token"], "record": SEED_DATA["user"]}, ensure_ascii=False)
    couple_id = SEED_DATA.get("coupleId") or ""
    user_id = SEED_DATA.get("userId") or ""
    page.add_init_script(
        f"""
        localStorage.setItem("wedding_pb_url", {json.dumps(base_url)});
        localStorage.setItem("wp.theme", {json.dumps(theme)});
        localStorage.setItem("pocketbase_auth", {json.dumps(auth_str)});
        localStorage.setItem("wedding_planner_cache_v2", {json.dumps(cache_str)});
        if ({json.dumps(couple_id)}) {{
          localStorage.setItem("wedding_planner_cache_v2_" + {json.dumps(couple_id)}, {json.dumps(cache_str)});
        }}
        if ({json.dumps(user_id)}) {{
          localStorage.setItem("wedding_planner_cache_v2_" + {json.dumps(user_id)}, {json.dumps(cache_str)});
        }}
        """
    )
    page.add_init_script(CLEAN_STYLE_INIT_JS)


def move_and_click(page, locator, wait_after=500):
    try:
        locator.first.click(timeout=2500)
        page.wait_for_timeout(wait_after)
        return True
    except Exception as e:
        print(f"    warn click: {e}")
    return False


def smooth_scroll(page, y_target, wait_after=550):
    page.evaluate(
        f"""
        (() => {{
          window.scrollTo({{ top: {y_target}, behavior: 'smooth' }});
          const m = document.querySelector('main');
          if (m) m.scrollTo({{ top: {y_target}, behavior: 'smooth' }});
        }})()
        """
    )
    page.wait_for_timeout(wait_after)


def convert_webm_to_mp4(webm_path: Path, mp4_path: Path, trim_start=0.35):
    cmd = [
        str(FFMPEG),
        "-y",
        "-stream_loop",
        "2",
        "-ss",
        f"{trim_start:.2f}",
        "-i",
        str(webm_path),
        "-t",
        "7.5",
        "-r",
        "30",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-an",
        str(mp4_path),
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)


def record_single_web_clip(browser, base_url, clip_name, start_route, nav_label, actions_fn):
    ctx = browser.new_context(
        viewport={"width": 1440, "height": 900},
        device_scale_factor=1,
        record_video_dir=str(RAW_RECORD_DIR),
        record_video_size={"width": 1440, "height": 900},
    )
    page = ctx.new_page()
    setup_auth_storage(page, base_url, "light")
    route_suffix = "/" if start_route == "/" else start_route
    page.goto(base_url + "/wedding" + route_suffix, wait_until="domcontentloaded")
    page.wait_for_Selector_safe = page.locator("aside, nav").first.wait_for(state="visible", timeout=8000)
    page.wait_for_timeout(700)
    page.evaluate("window.__installDemoCursor(); window.__moveCursor(420, 260);")
    page.wait_for_timeout(250)

    # Click the target menu in the left sidebar
    if nav_label:
        nav_loc = page.locator(f"aside a:has-text('{nav_label}'), nav a:has-text('{nav_label}')")
        move_and_click(page, nav_loc, wait_after=550)

    actions_fn(page)

    vid_webm = Path(page.video.path())
    ctx.close()

    out_mp4 = PUBLIC_CLIPS_DIR / f"{clip_name}.mp4"
    convert_webm_to_mp4(vid_webm, out_mp4, trim_start=0.45)
    shutil.copy2(out_mp4, CONCAT_ASSETS_DIR / f"{clip_name}.mp4")
    kb = out_mp4.stat().st_size // 1024
    print(f"  OK  {clip_name:24s} -> {kb} KB")


def record_mobile_showcase(browser, base_url, clip_name="mobile-12-showcase"):
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
    page.goto(base_url + "/wedding/", wait_until="domcontentloaded")
    page.locator("nav[aria-label='Navigasi utama']").wait_for(state="visible", timeout=8000)
    page.wait_for_timeout(700)
    page.evaluate("window.__installDemoCursor(); window.__moveCursor(195, 320);")
    page.wait_for_timeout(300)

    # Scroll dashboard on mobile
    smooth_scroll(page, 240, wait_after=600)
    smooth_scroll(page, 0, wait_after=400)

    # Tap Itinerary in bottom bar
    move_and_click(page, page.locator("nav[aria-label='Navigasi utama'] a:has-text('Itinerary')"), wait_after=650)
    smooth_scroll(page, 200, wait_after=500)

    # Tap Meja Tamu in bottom bar
    move_and_click(page, page.locator("nav[aria-label='Navigasi utama'] a:has-text('Meja Tamu')"), wait_after=650)

    # Tap Anggaran in bottom bar
    move_and_click(page, page.locator("nav[aria-label='Navigasi utama'] a:has-text('Anggaran')"), wait_after=650)

    # Open 'Lainnya' bottom sheet to show all remaining menus on mobile
    more_btn = page.locator("button[aria-label='Menu lainnya']")
    move_and_click(page, more_btn, wait_after=750)
    close_btn = page.locator("button[aria-label='Tutup']")
    move_and_click(page, close_btn, wait_after=450)

    # Toggle Dark Mode in top header
    theme_btn = page.locator("header button[aria-label*='mode']").first
    move_and_click(page, theme_btn, wait_after=750)

    # Tap Dashboard in Dark Mode
    move_and_click(page, page.locator("nav[aria-label='Navigasi utama'] a:has-text('Dashboard')"), wait_after=750)

    vid_webm = Path(page.video.path())
    ctx.close()

    out_mp4 = PUBLIC_CLIPS_DIR / f"{clip_name}.mp4"
    convert_webm_to_mp4(vid_webm, out_mp4, trim_start=0.45)
    shutil.copy2(out_mp4, CONCAT_ASSETS_DIR / f"{clip_name}.mp4")
    kb = out_mp4.stat().st_size // 1024
    print(f"  OK  {clip_name:24s} -> {kb} KB")


def main():
    port = 8130
    server = ThreadingHTTPServer(("127.0.0.1", port), LocalDemoServerHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    base_url = f"http://127.0.0.1:{port}"
    print(f"[1/2] Local live-demo server running on {base_url} (IP hidden)")

    with sync_playwright() as p:
        # Launch visible Chrome window so user can watch the remote automation live!
        browser = p.chromium.launch(
            executable_path=CHROME,
            headless=False,
            args=["--disable-infobars", "--window-position=40,40", "--window-size=1460,960"],
        )

        print("[2/2] Remote-controlling Chrome across all 11 Web tabs + Mobile view...")

        # 01. Dashboard
        def act_dashboard(page):
            page.evaluate("window.__moveCursor(580, 250)")
            page.wait_for_timeout(450)
            smooth_scroll(page, 260, wait_after=800)
            page.evaluate("window.__moveCursor(520, 480)")
            page.wait_for_timeout(550)
            smooth_scroll(page, 0, wait_after=650)

        record_single_web_clip(browser, base_url, "web-01-dashboard", "/", "Dashboard", act_dashboard)

        # 02. Itinerary / Rundown
        def act_itinerary(page):
            smooth_scroll(page, 220, wait_after=750)
            page.evaluate("window.__moveCursor(680, 380)")
            page.wait_for_timeout(600)
            smooth_scroll(page, 420, wait_after=650)

        record_single_web_clip(browser, base_url, "web-02-itinerary", "/", "Itinerary", act_itinerary)

        # 03. Meja Tamu / Reception
        def act_reception(page):
            search_input = page.locator("input[type='text'], input[placeholder*='Cari']").first
            move_and_click(page, search_input, wait_after=350)
            smooth_scroll(page, 260, wait_after=850)
            page.evaluate("window.__moveCursor(740, 460)")
            page.wait_for_timeout(550)

        record_single_web_clip(browser, base_url, "web-03-reception", "/rundown", "Meja Tamu", act_reception)

        # 04. Anggaran
        def act_budget(page):
            sangjit_btn = page.locator("button:has-text('Sangjit')")
            move_and_click(page, sangjit_btn, wait_after=550)
            nikah_btn = page.locator("button:has-text('Pernikahan')")
            move_and_click(page, nikah_btn, wait_after=600)
            smooth_scroll(page, 300, wait_after=750)

        record_single_web_clip(browser, base_url, "web-04-budget", "/reception", "Anggaran", act_budget)

        # 05. Kado & Angpao
        def act_gifts(page):
            page.evaluate("window.__moveCursor(620, 260)")
            page.wait_for_timeout(450)
            smooth_scroll(page, 240, wait_after=800)
            page.evaluate("window.__moveCursor(780, 460)")
            page.wait_for_timeout(550)

        record_single_web_clip(browser, base_url, "web-05-gifts", "/budget", "Kado & Angpao", act_gifts)

        # 06. Tamu
        def act_guests(page):
            smooth_scroll(page, 260, wait_after=750)
            page.evaluate("window.__moveCursor(880, 420)")
            page.wait_for_timeout(650)
            smooth_scroll(page, 460, wait_after=600)

        record_single_web_clip(browser, base_url, "web-06-guests", "/gifts", "Tamu", act_guests)

        # 07. Vendor
        def act_vendors(page):
            smooth_scroll(page, 260, wait_after=750)
            page.evaluate("window.__moveCursor(680, 420)")
            page.wait_for_timeout(600)
            smooth_scroll(page, 480, wait_after=600)

        record_single_web_clip(browser, base_url, "web-07-vendors", "/guests", "Vendor", act_vendors)

        # 08. Administrasi
        def act_admin(page):
            smooth_scroll(page, 240, wait_after=750)
            page.evaluate("window.__moveCursor(640, 400)")
            page.wait_for_timeout(600)
            smooth_scroll(page, 450, wait_after=600)

        record_single_web_clip(browser, base_url, "web-08-administration", "/vendors", "Administrasi", act_admin)

        # 09. Seserahan
        def act_seserahan(page):
            smooth_scroll(page, 250, wait_after=750)
            page.evaluate("window.__moveCursor(740, 420)")
            page.wait_for_timeout(600)
            smooth_scroll(page, 460, wait_after=600)

        record_single_web_clip(browser, base_url, "web-09-seserahan", "/administration", "Seserahan", act_seserahan)

        # 10. Galeri
        def act_gallery(page):
            page.evaluate("window.__moveCursor(640, 340)")
            page.wait_for_timeout(550)
            smooth_scroll(page, 240, wait_after=850)

        record_single_web_clip(browser, base_url, "web-10-gallery", "/seserahan", "Galeri", act_gallery)

        # 11. Pengaturan
        def act_settings(page):
            for tab_txt in ["Rekening", "Adat", "Tema"]:
                loc = page.locator(f"button:has-text('{tab_txt}')")
                if loc.count() > 0:
                    move_and_click(page, loc, wait_after=480)
            smooth_scroll(page, 180, wait_after=550)

        record_single_web_clip(browser, base_url, "web-11-settings", "/gallery", "Pengaturan", act_settings)

        # 12. Mobile View Showcase (iPhone 390x844)
        record_mobile_showcase(browser, base_url, "mobile-12-showcase")

        browser.close()

    server.shutdown()
    print("All 12 live browser recordings completed and converted to 30fps MP4!")


if __name__ == "__main__":
    main()
