"""
Builds editable Concat Desktop projects using Concat's built-in headless MCP server
(`C:\\Program Files\\Concat\\concat.exe --mcp headless`):

1. `Wedding-Planner-Reels-9x16` (1080x1920 @ 30fps):
   - Track T1: 12 modular scene clips (each displaying BOTH Web Desktop + iPhone Notch Mobile View)
   - Track T2: Editable Headline Titles
   - Track T3: Editable Subtitle / Feature Explanations
   - Media Bin: All 23 RAW live recordings (`web-01..11.mp4`, `mobile-01..12.mp4`),
     continuous raw tours (`raw-web-live-tour.mp4`, `raw-mobile-iphone-tour.mp4`),
     all raw screenshots (`d-*.png`, `m-*.png`), and Instagram slides.

2. `Wedding-Planner-Feed-4x5` (1080x1350 @ 30fps):
   - Same structure for 4:5 Instagram Portrait Feed + all RAW files in Media Bin.

3. `Wedding-Planner-Raw-Live-Layers` (1080x1920 @ 30fps):
   - Track T1 (Raw Web Browser Track): Raw `web-01..11.mp4` clips directly on T1
   - Track T2 (Raw Mobile iPhone Track): Raw `mobile-01..11.mp4` clips layered on T2 (Picture-in-Picture)
   - Track T3 & T4: Editable Headline & Subtitle Titles
"""

import base64
import json
import shutil
import subprocess
from pathlib import Path

CONCAT_EXE = r"C:\Program Files\Concat\concat.exe"
MARKETING_DIR = Path(__file__).resolve().parent
OUT_DIR = MARKETING_DIR / "out"
CONCAT_ASSETS_DIR = MARKETING_DIR / "concat-assets"
SHOTS_DIR = MARKETING_DIR / "shots"
PROJECTS_DIR = MARKETING_DIR / "concat-projects"

SCENES = [
    {
        "id": "01-dashboard",
        "web_raw": "web-01-dashboard.mp4",
        "mob_raw": "mobile-01-dashboard.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Dashboard: Pantau hitung mundur &\nkesiapan acara dalam satu layar.",
        "subtitle": "Terlihat sisa hari menuju akad, dana tabungan terkumpul,\nprogres persiapan, dan peringatan tugas minggu ini.",
    },
    {
        "id": "02-itinerary",
        "web_raw": "web-02-itinerary.mp4",
        "mob_raw": "mobile-02-itinerary.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Itinerary: Susunan acara menit demi\nmenit & kontak WA PIC.",
        "subtitle": "Atur jadwal rias subuh, akad, hingga resepsi. Dilengkapi\ntombol hubungi PIC & ekspor ke Google/Apple Calendar (.ics).",
    },
    {
        "id": "03-reception",
        "web_raw": "web-03-reception.mp4",
        "mob_raw": "mobile-03-reception.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Meja Tamu: Cari nama tamu 2 detik,\ntandai hadir & suvenir.",
        "subtitle": "Dipakai penerima tamu di lobi gedung untuk mencatat kehadiran\naktual, jumlah orang masuk, meja VIP, dan tamu walk-in.",
    },
    {
        "id": "04-budget",
        "web_raw": "web-04-budget.mp4",
        "mob_raw": "mobile-04-budget.mp4",
        "dur": 105 / 30.0,
        "title": "Menu Anggaran: Kelola arus kas, biaya\nSeserahan, & 86 pos pernikahan.",
        "subtitle": "Catat pemasukan tabungan pengantin pria & wanita, pindah antar\ntab Arus Kas, Seserahan, dan Pernikahan, serta pantau sisa tagihan.",
    },
    {
        "id": "05-gifts",
        "web_raw": "web-05-gifts.mp4",
        "mob_raw": "mobile-05-gifts.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Kado & Angpao: Catat amplop tunai,\ntransfer QRIS, & kado fisik.",
        "subtitle": "Rekap seluruh tanda kasih dari tamu undangan beserta taksiran\nnilai dan status pengiriman pesan ucapan terima kasih.",
    },
    {
        "id": "06-guests",
        "web_raw": "web-06-guests.mp4",
        "mob_raw": "mobile-06-guests.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Tamu: Kelola 165 undangan (281 orang)\n& kirim WA sekali klik.",
        "subtitle": "Kelompokkan tamu per keluarga, teman kantor, dan prioritas A/B/C.\nKirim pesan WhatsApp otomatis menyapa nama tamu.",
    },
    {
        "id": "07-vendors",
        "web_raw": "web-07-vendors.mp4",
        "mob_raw": "mobile-07-vendors.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Vendor: Pantau 52 tugas vendor dari\nbooking hingga lunas.",
        "subtitle": "Lacak progres survei gedung, food tasting katering, fitting busana,\nhingga tanggal jatuh tempo pembayaran DP setiap vendor.",
    },
    {
        "id": "08-administration",
        "web_raw": "web-08-administration.mp4",
        "mob_raw": "mobile-08-administration.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Administrasi: Cek 59 syarat dokumen\nKUA (N1-N4) pria & wanita.",
        "subtitle": "Panduan pengurusan surat pengantar RT/RW, kelurahan, puskesmas,\nhingga pendaftaran KUA untuk CPP dan CPW berdampingan.",
    },
    {
        "id": "09-seserahan",
        "web_raw": "web-09-seserahan.mp4",
        "mob_raw": "mobile-09-seserahan.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Seserahan: 45 barang hantaran lengkap\ndengan link Shopee.",
        "subtitle": "Simpan link produk Shopee/Tokopedia di setiap barang seserahan,\nbandingkan harga perkiraan vs harga beli asli.",
    },
    {
        "id": "10-gallery",
        "web_raw": "web-10-gallery.mp4",
        "mob_raw": "mobile-10-gallery.mp4",
        "dur": 90 / 30.0,
        "title": "Menu Galeri: Simpan foto referensi dekorasi,\nbusana, & dokumentasi.",
        "subtitle": "Kumpulkan foto inspirasi pelaminan, baju akad, rias, hingga\nfoto prewedding agar mudah ditunjukkan ke vendor.",
    },
    {
        "id": "11-settings",
        "web_raw": "web-11-settings.mp4",
        "mob_raw": "mobile-11-settings.mp4",
        "dur": 95 / 30.0,
        "title": "Menu Pengaturan: Atur profil pengantin,\nrekening QRIS, adat, & akses.",
        "subtitle": "Sesuaikan nama pasangan, gedung acara, nomor rekening/QRIS,\nkategori adat, zona waktu, hingga akses Panitia.",
    },
    {
        "id": "12-mobile-showcase",
        "web_raw": "web-01-dashboard.mp4",
        "mob_raw": "mobile-12-showcase.mp4",
        "dur": 155 / 30.0,
        "title": "Tampilan HP iPhone ber-Notch: Praktis\ndibawa ke gedung & survei vendor.",
        "subtitle": "Buka dari HP kapan saja dengan navigasi tab bawah & Mode Gelap.\nUji gratis sekarang: demo / demo123.",
    },
]


class ConcatMCPClient:
    def __init__(self):
        self.proc = subprocess.Popen(
            [CONCAT_EXE, "--mcp", "headless"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
        )
        self.req_id = 0
        self._initialize()

    def _initialize(self):
        self.req_id += 1
        self._send(
            {
                "jsonrpc": "2.0",
                "id": self.req_id,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "wedding-planner-builder", "version": "1.0"},
                },
            }
        )
        self._recv()
        self._send({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def _send(self, payload):
        self.proc.stdin.write(json.dumps(payload) + "\n")
        self.proc.stdin.flush()

    def _recv(self):
        line = self.proc.stdout.readline()
        if not line:
            raise RuntimeError("Concat MCP server closed stdout unexpectedly")
        return json.loads(line)

    def call(self, tool_name, arguments):
        self.req_id += 1
        self._send(
            {
                "jsonrpc": "2.0",
                "id": self.req_id,
                "method": "tools/call",
                "params": {"name": tool_name, "arguments": arguments},
            }
        )
        resp = self._recv()
        if "error" in resp:
            raise RuntimeError(f"Tool {tool_name} error: {resp['error']}")
        result = resp.get("result", {})
        if result.get("isError"):
            text = result.get("content", [{}])[0].get("text", "")
            raise RuntimeError(f"Tool {tool_name} refused: {text}")
        content = result.get("content", [])
        if content and content[0].get("type") == "text":
            try:
                return json.loads(content[0]["text"])
            except Exception:
                return content[0]["text"]
        return content

    def close(self):
        self.proc.terminate()


def get_all_raw_files(is_reels=True):
    raw_files = [
        CONCAT_ASSETS_DIR / "raw-web-live-tour.mp4",
        CONCAT_ASSETS_DIR / "raw-mobile-iphone-tour.mp4",
        OUT_DIR / ("overview-reels-9x16.mp4" if is_reels else "overview-feed-4x5.mp4"),
    ]
    for sc in SCENES:
        raw_files.append(CONCAT_ASSETS_DIR / sc["web_raw"])
        raw_files.append(CONCAT_ASSETS_DIR / sc["mob_raw"])
    if SHOTS_DIR.exists():
        for png in sorted(SHOTS_DIR.glob("*.png")):
            raw_files.append(png)
    for slide_png in sorted(OUT_DIR.glob("ig-*.png")):
        raw_files.append(slide_png)
    return raw_files


def build_project(client: ConcatMCPClient, name: str, width: int, height: int, prefix: str, is_reels: bool):
    proj_path = PROJECTS_DIR / name
    if proj_path.exists():
        shutil.rmtree(proj_path)

    print(f"\n=== Building Concat Project: {name} ({width}x{height} @ 30fps) ===")
    client.call(
        "project_create",
        {
            "location": str(PROJECTS_DIR),
            "name": name,
            "video": {
                "width": width,
                "height": height,
                "rateNum": 30,
                "rateDen": 1,
                "colorSpace": "sdr",
            },
        },
    )
    path_str = str(proj_path)
    tl_state = client.call("timeline_read", {"path": path_str})
    timeline_id = tl_state["timeline"]["id"]
    tracks = tl_state["timeline"]["tracks"]
    video_track_id = tracks[0]["id"]
    headline_track_id = tracks[1]["id"]
    subtitle_track_id = tracks[2]["id"]

    client.call(
        "timeline_background",
        {
            "path": path_str,
            "timelineId": timeline_id,
            "background": {"kind": "color", "color": "#faf7f4"},
        },
    )

    # 1. Import 12 modular scene clips (Web + Mobile iPhone view combined)
    scene_media_ids = []
    for idx, sc in enumerate(SCENES):
        clip_file = CONCAT_ASSETS_DIR / f"{prefix}-scene-{idx + 1:02d}-{sc['id']}.mp4"
        res = client.call("media_import", {"path": path_str, "file": str(clip_file)})
        scene_media_ids.append(res["createdId"])
        print(f"  + Imported modular scene clip: {clip_file.name} -> {res['createdId']}")

    # 2. Lay down all 12 scene clips end-to-end on Track T1
    client.call(
        "clips_add_sequence",
        {
            "path": path_str,
            "trackId": video_track_id,
            "mediaIds": scene_media_ids,
            "start": 0.0,
        },
    )

    tl_state = client.call("timeline_read", {"path": path_str})
    video_clips = [c for c in tl_state["timeline"]["clips"] if c["track"] == video_track_id]
    for idx, vc in enumerate(video_clips):
        patch = {}
        if idx == 0:
            patch["fadeIn"] = 0.2
        else:
            patch["transitionIn"] = {"id": "concat.dissolve", "duration": 0.28}
        if idx == len(video_clips) - 1:
            patch["fadeOut"] = 0.3
        client.call("clip_update", {"path": path_str, "clipId": vc["id"], "patch": patch})

    # 3. Add Editable Native Concat Text Titles on T2 (Headline) & T3 (Subcopy)
    left_align_x = -0.068
    head_font_size = 0.0195 if is_reels else 0.0235
    head_offset_y = -0.382 if is_reels else -0.356
    sub_font_size = 0.0108 if is_reels else 0.0132
    sub_offset_y = -0.314 if is_reels else -0.270

    for idx, sc in enumerate(SCENES):
        vc = video_clips[idx]
        start_sec = vc["start"]
        dur_sec = vc["duration"]

        h_res = client.call(
            "title_add",
            {
                "path": path_str,
                "trackId": headline_track_id,
                "start": start_sec,
                "duration": dur_sec,
                "offsetY": head_offset_y,
                "style": {
                    "content": sc["title"],
                    "fontFamily": "Inter",
                    "fontSize": head_font_size,
                    "fontWeight": 800,
                    "color": "#1c1917",
                    "align": "left",
                    "lineHeight": 1.16,
                    "maxWidth": 0.86,
                    "shadow": False,
                },
            },
        )
        h_id = h_res["createdId"]
        client.call(
            "clip_transform",
            {
                "path": path_str,
                "clipId": h_id,
                "offsetX": left_align_x,
                "offsetY": head_offset_y,
            },
        )
        client.call(
            "clip_update",
            {
                "path": path_str,
                "clipId": h_id,
                "patch": {"fadeIn": 0.15, "fadeOut": 0.15},
            },
        )

        s_res = client.call(
            "title_add",
            {
                "path": path_str,
                "trackId": subtitle_track_id,
                "start": start_sec,
                "duration": dur_sec,
                "offsetY": sub_offset_y,
                "style": {
                    "content": sc["subtitle"],
                    "fontFamily": "Inter",
                    "fontSize": sub_font_size,
                    "fontWeight": 500,
                    "color": "#44403c",
                    "align": "left",
                    "lineHeight": 1.36,
                    "maxWidth": 0.86,
                    "shadow": False,
                },
            },
        )
        s_id = s_res["createdId"]
        client.call(
            "clip_transform",
            {
                "path": path_str,
                "clipId": s_id,
                "offsetX": left_align_x,
                "offsetY": sub_offset_y,
            },
        )
        client.call(
            "clip_update",
            {
                "path": path_str,
                "clipId": s_id,
                "patch": {"fadeIn": 0.15, "fadeOut": 0.15},
            },
        )

    # 4. Import ALL RAW FILES (web-01..11.mp4, mobile-01..12.mp4, raw tours, raw PNG shots) into Media Bin!
    imported_count = 0
    for ef in get_all_raw_files(is_reels=is_reels):
        if ef.exists():
            client.call("media_import", {"path": path_str, "file": str(ef)})
            imported_count += 1
    print(f"  + Imported {imported_count} raw Web & Mobile video/image files into Media Bin")

    prev = client.call("preview_frame", {"path": path_str, "time": 1.2})
    for item in prev if isinstance(prev, list) else []:
        if item.get("type") == "image" and item.get("data"):
            img_bytes = base64.b64decode(item["data"])
            preview_path = CONCAT_ASSETS_DIR / f"concat-preview-{prefix}.png"
            preview_path.write_bytes(img_bytes)
            print(f"  + Saved Concat compositor preview frame: {preview_path}")

    client.call("project_save", {"path": path_str})
    client.call("project_close", {"path": path_str, "save": True})
    print(f"=== Saved Concat Project: {proj_path} ===")
    return proj_path


def build_raw_multilayer_project(client: ConcatMCPClient, name="Wedding-Planner-Raw-Live-Layers"):
    """
    Creates a pure RAW multi-track project (just like Kept-Modular-Live-Layers) where:
    - Track T1 holds the RAW Web Browser recordings (`web-01-dashboard.mp4` .. `web-11-settings.mp4`)
    - Track T2 holds the RAW Mobile iPhone recordings (`mobile-01-dashboard.mp4` .. `mobile-12-showcase.mp4`)
      layered as Picture-in-Picture on top of the Web Browser so the user can move/scale them independently!
    - Track T3 holds the Editable Text Titles for each menu.
    """
    proj_path = PROJECTS_DIR / name
    if proj_path.exists():
        shutil.rmtree(proj_path)

    print(f"\n=== Building Pure Raw Multi-Track Project: {name} (1080x1920 @ 30fps) ===")
    client.call(
        "project_create",
        {
            "location": str(PROJECTS_DIR),
            "name": name,
            "video": {
                "width": 1080,
                "height": 1920,
                "rateNum": 30,
                "rateDen": 1,
                "colorSpace": "sdr",
            },
        },
    )
    path_str = str(proj_path)
    tl_state = client.call("timeline_read", {"path": path_str})
    timeline_id = tl_state["timeline"]["id"]
    tracks = tl_state["timeline"]["tracks"]
    web_track_id = tracks[0]["id"]       # T1: Raw Web Clips
    mob_track_id = tracks[1]["id"]       # T2: Raw Mobile iPhone Clips (PiP overlay)
    title_track_id = tracks[2]["id"]     # T3: Editable Titles

    client.call(
        "timeline_background",
        {
            "path": path_str,
            "timelineId": timeline_id,
            "background": {"kind": "color", "color": "#faf7f4"},
        },
    )

    cursor_sec = 0.0
    imported_media = {}
    for idx, sc in enumerate(SCENES):
        dur_sec = round(sc["dur"], 2)
        web_file = str(CONCAT_ASSETS_DIR / sc["web_raw"])
        mob_file = str(CONCAT_ASSETS_DIR / sc["mob_raw"])

        if web_file not in imported_media:
            imported_media[web_file] = client.call("media_import", {"path": path_str, "file": web_file})["createdId"]
        if mob_file not in imported_media:
            imported_media[mob_file] = client.call("media_import", {"path": path_str, "file": mob_file})["createdId"]

        w_media = imported_media[web_file]
        m_media = imported_media[mob_file]

        # Place Raw Web Clip on Track T1
        w_clip = client.call(
            "clip_add",
            {
                "path": path_str,
                "trackId": web_track_id,
                "mediaId": w_media,
                "start": cursor_sec,
                "duration": dur_sec,
            },
        )["createdId"]
        client.call(
            "clip_transform",
            {
                "path": path_str,
                "clipId": w_clip,
                "scale": 0.92,
                "offsetX": 0.0,
                "offsetY": -0.06,
            },
        )

        # Place Raw Mobile iPhone Clip on Track T2 (Picture-in-Picture on bottom-right)
        m_clip = client.call(
            "clip_add",
            {
                "path": path_str,
                "trackId": mob_track_id,
                "mediaId": m_media,
                "start": cursor_sec,
                "duration": dur_sec,
            },
        )["createdId"]
        client.call(
            "clip_transform",
            {
                "path": path_str,
                "clipId": m_clip,
                "scale": 0.44 if idx < 11 else 0.78,
                "offsetX": 0.25 if idx < 11 else 0.0,
                "offsetY": 0.23 if idx < 11 else 0.06,
            },
        )

        # Place Editable Title on Track T3
        t_clip = client.call(
            "title_add",
            {
                "path": path_str,
                "trackId": title_track_id,
                "start": cursor_sec,
                "duration": dur_sec,
                "offsetY": -0.37,
                "style": {
                    "content": f"{sc['title']}\n{sc['subtitle']}",
                    "fontFamily": "Inter",
                    "fontSize": 0.017,
                    "fontWeight": 700,
                    "color": "#1c1917",
                    "align": "left",
                    "lineHeight": 1.25,
                    "maxWidth": 0.88,
                    "shadow": False,
                },
            },
        )["createdId"]
        client.call(
            "clip_transform",
            {
                "path": path_str,
                "clipId": t_clip,
                "offsetX": -0.04,
                "offsetY": -0.37,
            },
        )

        cursor_sec = round(cursor_sec + dur_sec, 2)

    # Also import continuous raw tours and rendered videos into Media Bin
    for ef in get_all_raw_files(is_reels=True):
        if ef.exists():
            client.call("media_import", {"path": path_str, "file": str(ef)})

    client.call("project_save", {"path": path_str})
    client.call("project_close", {"path": path_str, "save": True})
    print(f"=== Saved Pure Raw Multi-Track Project: {proj_path} ===")
    return proj_path


def main():
    # Close any open Concat GUI window first so it doesn't lock or overwrite the project files
    subprocess.run(["taskkill", "/F", "/IM", "concat.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    client = ConcatMCPClient()
    try:
        build_project(
            client,
            name="Wedding-Planner-Reels-9x16",
            width=1080,
            height=1920,
            prefix="reels",
            is_reels=True,
        )
        build_project(
            client,
            name="Wedding-Planner-Feed-4x5",
            width=1080,
            height=1350,
            prefix="feed",
            is_reels=False,
        )
        build_raw_multilayer_project(
            client,
            name="Wedding-Planner-Raw-Live-Layers",
        )
        print("\nAll 3 Concat projects created and saved with full RAW Web & Mobile files!")
    finally:
        client.close()


if __name__ == "__main__":
    main()
