"""
Capture live demo screenshots (Desktop Web View + iPhone Mobile View)
using the live demo account (demo / demo123) on https://43.156.236.102.
"""
import json
import os
import shutil
import ssl
import subprocess
import threading
import time
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(ROOT)
DIST = os.path.join(PROJECT, "dist")
SHOTS_DIR = os.path.join(ROOT, "shots")
PUBLIC_SHOTS_DIR = os.path.join(PROJECT, "public", "marketing", "shots")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
VPS_API = "https://43.156.236.102/wedding-api"

os.makedirs(SHOTS_DIR, exist_ok=True)
os.makedirs(PUBLIC_SHOTS_DIR, exist_ok=True)

SEED_DATA = {}


def fetch_live_demo_data():
    global SEED_DATA
    ctx = ssl._create_unverified_context()
    print("[1/3] Authenticating live demo account (demo / demo123)...")
    auth_req = urllib.request.Request(
        f"{VPS_API}/collections/users/auth-with-password",
        data=json.dumps({"identity": "demo", "password": "demo123"}).encode(),
        headers={"Content-Type": "application/json"},
    )
    auth = json.loads(urllib.request.urlopen(auth_req, context=ctx, timeout=15).read().decode())
    token = auth["token"]
    user = auth["record"]
    couple_id = user.get("couple")
    user_id = user.get("id")

    def get_list(col, sort="", per_page=250):
        q = f"perPage={per_page}&filter=" + urllib.parse.quote(f'couple="{couple_id}"')
        if sort:
            q += "&sort=" + urllib.parse.quote(sort)
        url = f"{VPS_API}/collections/{col}/records?{q}"
        req = urllib.request.Request(url, headers={"Authorization": token})
        try:
            data = json.loads(urllib.request.urlopen(req, context=ctx, timeout=15).read().decode())
            return data.get("items", [])
        except Exception as e:
            print(f"  warn: {col}: {e}")
            return []

    req_c = urllib.request.Request(
        f"{VPS_API}/collections/couples/records/{couple_id}",
        headers={"Authorization": token},
    )
    couple = json.loads(urllib.request.urlopen(req_c, context=ctx, timeout=15).read().decode())

    budgets = get_list("budgets", "budget_type,category")
    administrations = get_list("administrations", "sort_order")
    seserahan = get_list("seserahan_items", "category")
    vendors = get_list("vendor_checklists", "sort_order")
    guests = get_list("wedding_guests", "name")
    cashflow = get_list("cashflow_entries", "sort_order")
    logs = get_list("activity_logs", "-created", 40)
    photos = get_list("gallery_photos", "sort_order,-created")
    settings_list = get_list("app_settings", "", 1)
    rundowns = get_list("rundown_events", "time_start,sort_order")
    gifts = get_list("wedding_gifts", "-created")

    SEED_DATA = {
        "token": token,
        "user": user,
        "userId": user_id,
        "coupleId": couple_id,
        "collections": {
            "couples": [couple],
            "budgets": budgets,
            "administrations": administrations,
            "seserahan_items": seserahan,
            "vendor_checklists": vendors,
            "wedding_guests": guests,
            "cashflow_entries": cashflow,
            "activity_logs": logs,
            "gallery_photos": photos,
            "app_settings": settings_list,
            "recycle_bin": [],
            "rundown_events": rundowns,
            "wedding_gifts": gifts,
        },
        "cache": {
            "couple": couple,
            "budgets": budgets,
            "administrations": administrations,
            "seserahan": seserahan,
            "vendors": vendors,
            "guests": guests,
            "cashflow": cashflow,
            "logs": logs,
            "settings": settings_list[0] if settings_list else None,
            "photos": photos,
            "trashItems": [],
            "rundowns": rundowns,
            "gifts": gifts,
            "cachedAt": int(time.time() * 1000),
        },
    }

    seed_path = os.path.join(ROOT, "live_demo_seed.json")
    with open(seed_path, "w", encoding="utf-8") as f:
        json.dump(SEED_DATA, f, ensure_ascii=False)

    print(
        f"  Live data fetched: {len(guests)} guests, {len(budgets)} budgets, "
        f"{len(vendors)} vendors, {len(administrations)} docs, "
        f"{len(seserahan)} seserahan, {len(rundowns)} rundowns, {len(gifts)} gifts."
    )


class Handler(SimpleHTTPRequestHandler):
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
            # /api/collections/<col>/records or /api/collections/<col>/records/<id>
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
        if path.startswith("/m/"):
            return os.path.join(ROOT, path[3:].lstrip("/"))
        rel = path.lstrip("/")
        full = os.path.join(DIST, rel)
        if rel and os.path.isfile(full):
            return full
        if os.path.isdir(full) and os.path.isfile(os.path.join(full, "index.html")):
            return os.path.join(full, "index.html")
        if rel.startswith("assets/"):
            return full
        return os.path.join(DIST, "index.html")

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


class FastThreadingHTTPServer(ThreadingHTTPServer):
    request_queue_size = 128


def main():
    fetch_live_demo_data()

    port = 8129
    server = FastThreadingHTTPServer(("127.0.0.1", port), Handler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    print(f"[2/3] Local capture server + live API mirror started on http://127.0.0.1:{port}/")

    jobs = [
        # Mobile views (390x844 @ 2x -> 780x1688)
        {"name": "m-dashboard", "route": "/", "w": 390, "h": 844, "y": 0, "theme": "light"},
        {"name": "m-dashboard-dark", "route": "/", "w": 390, "h": 844, "y": 0, "theme": "dark"},
        {"name": "m-budget", "route": "/budget", "w": 390, "h": 844, "y": 0, "theme": "light"},
        {"name": "m-budget-wedding", "route": "/budget", "w": 390, "h": 844, "y": 240, "theme": "light", "click": "Pernikahan"},
        {"name": "m-guests", "route": "/guests", "w": 390, "h": 844, "y": 260, "theme": "light"},
        {"name": "m-reception", "route": "/reception", "w": 390, "h": 844, "y": 210, "theme": "light"},
        {"name": "m-rundown", "route": "/rundown", "w": 390, "h": 844, "y": 240, "theme": "light"},
        {"name": "m-vendors", "route": "/vendors", "w": 390, "h": 844, "y": 280, "theme": "light"},
        {"name": "m-gifts", "route": "/gifts", "w": 390, "h": 844, "y": 190, "theme": "light"},
        {"name": "m-administration", "route": "/administration", "w": 390, "h": 844, "y": 220, "theme": "light"},
        {"name": "m-seserahan", "route": "/seserahan", "w": 390, "h": 844, "y": 230, "theme": "light"},
        {"name": "m-settings", "route": "/settings", "w": 390, "h": 844, "y": 0, "theme": "light"},
        # Desktop Web views (1440x900 @ 2x -> 2880x1800)
        {"name": "d-dashboard", "route": "/", "w": 1440, "h": 900, "y": 0, "theme": "light"},
        {"name": "d-dashboard-dark", "route": "/", "w": 1440, "h": 900, "y": 0, "theme": "dark"},
        {"name": "d-budget", "route": "/budget", "w": 1440, "h": 900, "y": 0, "theme": "light", "click": "Pernikahan"},
        {"name": "d-guests", "route": "/guests", "w": 1440, "h": 900, "y": 0, "theme": "light"},
        {"name": "d-reception", "route": "/reception", "w": 1440, "h": 900, "y": 0, "theme": "light"},
        {"name": "d-rundown", "route": "/rundown", "w": 1440, "h": 900, "y": 0, "theme": "light"},
        {"name": "d-vendors", "route": "/vendors", "w": 1440, "h": 900, "y": 0, "theme": "light"},
        {"name": "d-gifts", "route": "/gifts", "w": 1440, "h": 900, "y": 0, "theme": "light"},
        {"name": "d-administration", "route": "/administration", "w": 1440, "h": 900, "y": 0, "theme": "light"},
        {"name": "d-seserahan", "route": "/seserahan", "w": 1440, "h": 900, "y": 0, "theme": "light"},
    ]

    print(f"[3/3] Capturing {len(jobs)} high-DPI screenshots via headless Chrome...")
    for j in jobs:
        out_file = os.path.join(SHOTS_DIR, j["name"] + ".png")
        params = {
            "route": j["route"],
            "w": j["w"],
            "h": j["h"],
            "y": j.get("y", 0),
            "theme": j.get("theme", "light"),
            "click": j.get("click", ""),
        }
        url = f"http://127.0.0.1:{port}/m/shot.html?" + urllib.parse.urlencode(params)
        cmd = [
            CHROME,
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--hide-scrollbars",
            "--force-device-scale-factor=2",
            f"--window-size={j['w']},{j['h']}",
            "--virtual-time-budget=9000",
            f"--screenshot={out_file}",
            url,
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.isfile(out_file):
            shutil.copy2(out_file, os.path.join(PUBLIC_SHOTS_DIR, j["name"] + ".png"))
            sz = os.path.getsize(out_file) // 1024
            print(f"  OK  {j['name']:20s} ({j['w']}x{j['h']} @2x) -> {sz} KB")
        else:
            print(f"  ERR {j['name']}")

    server.shutdown()
    print("Done! All screenshots saved to marketing/shots/ and public/marketing/shots/")


if __name__ == "__main__":
    main()
