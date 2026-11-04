"""
Builds editable Concat Desktop projects (9:16 Reels & 4:5 Feed) using Concat's
built-in headless MCP server (`C:\\Program Files\\Concat\\concat.exe --mcp headless`).

Each Concat project includes:
- Track T1 (Base Video Track): 6 modular animated scene clips (Web View Zoom-In/Zoom-Out + iPhone Notch)
  with smooth Dissolve transitions — so the user can trim, reorder, remove, or add scenes.
- Track T2 (Editable Headline Titles — above video): Native Concat Text Titles for each scene's main headline
  — click in Concat to edit words, font, size, color, or position.
- Track T3 (Editable Subcopy Titles — above video): Native Concat Text Titles for each scene's feature explanation.
- Media Bin: All 6 modular scenes, the full rendered video, all 13 Instagram PNG slides,
  and live Web & Mobile screenshots ready to drag and drop onto the timeline.
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
        "id": "intro",
        "title": "Semua persiapan nikah rapi di satu tempat,\ntersambung di laptop dan HP.",
        "subtitle": "Atur tabungan & budget, daftar tamu, undangan WhatsApp,\njadwal vendor, berkas KUA, seserahan, hingga buku tamu resepsi.",
    },
    {
        "id": "budget",
        "title": "Atur budget Rp 85 juta di 86 pos biaya\ntanpa pusing rumus manual.",
        "subtitle": "Catat tabungan pengantin pria & wanita, pisahkan biaya Lamaran\ndan Resepsi, lalu pantau selisih budget vs pengeluaran asli.",
    },
    {
        "id": "guests",
        "title": "Kelola 165 undangan (281 orang) &\nkirim pesan WhatsApp sekali klik.",
        "subtitle": "Kelompokkan tamu per keluarga, teman kantor, dan prioritas A/B/C.\nPesan WhatsApp otomatis menyapa nama masing-masing tamu.",
    },
    {
        "id": "harih",
        "title": "Check-in tamu di gedung 2 detik &\njadwal acara menit demi menit.",
        "subtitle": "Petugas buku tamu cukup buka dari HP untuk catat tamu hadir & suvenir.\nJadwal rundown lengkap dengan kontak WA PIC & ekspor kalender.",
    },
    {
        "id": "vendors-seserahan",
        "title": "52 tugas vendor, 59 berkas KUA (N1-N4),\n& 45 barang seserahan.",
        "subtitle": "Pantau tenggat bayar DP vendor, cek kelengkapan surat nikah KUA,\ndan simpan link belanja Shopee/Tokopedia untuk tiap seserahan.",
    },
    {
        "id": "gifts-cta",
        "title": "Catat amplop & kado dengan aman.\nCoba akun demo sekarang.",
        "subtitle": "Rekap amplop tunai, QRIS, emas, dan kado fisik. Data keuangan\nterkunci dari akun Panitia. Uji gratis: demo / demo123.",
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
    # In Concat: T1 (index 0) is the bottom/base video track; T2 (index 1) & T3 (index 2) render OVER T1!
    video_track_id = tracks[0]["id"]
    headline_track_id = tracks[1]["id"]
    subtitle_track_id = tracks[2]["id"]

    # Set warm paper background
    client.call(
        "timeline_background",
        {
            "path": path_str,
            "timelineId": timeline_id,
            "background": {"kind": "color", "color": "#faf7f4"},
        },
    )

    # 1. Import 6 modular scene clips
    scene_media_ids = []
    for idx, sc in enumerate(SCENES):
        clip_file = CONCAT_ASSETS_DIR / f"{prefix}-scene-0{idx + 1}-{sc['id']}.mp4"
        res = client.call("media_import", {"path": path_str, "file": str(clip_file)})
        scene_media_ids.append(res["createdId"])
        print(f"  + Imported modular scene clip: {clip_file.name} -> {res['createdId']}")

    # 2. Lay down all 6 scene clips end-to-end on Track T1 (bottom video track)
    client.call(
        "clips_add_sequence",
        {
            "path": path_str,
            "trackId": video_track_id,
            "mediaIds": scene_media_ids,
            "start": 0.0,
        },
    )

    # Read back clip IDs on Track T1 to add smooth Dissolve transitions
    tl_state = client.call("timeline_read", {"path": path_str})
    video_clips = [c for c in tl_state["timeline"]["clips"] if c["track"] == video_track_id]
    for idx, vc in enumerate(video_clips):
        patch = {}
        if idx == 0:
            patch["fadeIn"] = 0.25
        else:
            patch["transitionIn"] = {"id": "concat.dissolve", "duration": 0.35}
        if idx == len(video_clips) - 1:
            patch["fadeOut"] = 0.35
        client.call("clip_update", {"path": path_str, "clipId": vc["id"], "patch": patch})

    # 3. Add Editable Native Concat Text Titles on T2 (Headline) & T3 (Subcopy) ABOVE the video!
    left_align_x = -0.068
    head_font_size = 0.0202 if is_reels else 0.0245
    head_offset_y = -0.375 if is_reels else -0.348
    sub_font_size = 0.0112 if is_reels else 0.0135
    sub_offset_y = -0.285 if is_reels else -0.242

    for idx, sc in enumerate(SCENES):
        start_sec = idx * 4.0
        dur_sec = 4.0

        # Add Editable Headline Title Clip on T2 (above T1)
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
                    "lineHeight": 1.18,
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
                "patch": {"fadeIn": 0.2, "fadeOut": 0.2},
            },
        )

        # Add Editable Subtitle / Feature Explanation Clip on T3 (above T2)
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
                    "lineHeight": 1.38,
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
                "patch": {"fadeIn": 0.2, "fadeOut": 0.2},
            },
        )

    # 4. Import full rendered video, all 13 Instagram PNG slides, and live screenshots into Media Bin
    extra_files = [
        OUT_DIR / ("overview-reels-9x16.mp4" if is_reels else "overview-feed-4x5.mp4"),
        OUT_DIR / "ig-01-cover.png",
        OUT_DIR / "ig-02-dasbor.png",
        OUT_DIR / "ig-03-anggaran.png",
        OUT_DIR / "ig-04-tamu.png",
        OUT_DIR / "ig-05-resepsi.png",
        OUT_DIR / "ig-06-rundown.png",
        OUT_DIR / "ig-07-vendor.png",
        OUT_DIR / "ig-08-admin-seserahan.png",
        OUT_DIR / "ig-09-kado-privasi.png",
        OUT_DIR / "ig-10-cta.png",
        OUT_DIR / "story-01-cover.png",
        OUT_DIR / "story-10-cta.png",
        OUT_DIR / "square-01-cover.png",
        SHOTS_DIR / "d-dashboard.png",
        SHOTS_DIR / "d-budget.png",
        SHOTS_DIR / "d-guests.png",
        SHOTS_DIR / "d-reception.png",
        SHOTS_DIR / "d-rundown.png",
        SHOTS_DIR / "d-vendors.png",
        SHOTS_DIR / "d-administration.png",
        SHOTS_DIR / "d-seserahan.png",
        SHOTS_DIR / "d-gifts.png",
        SHOTS_DIR / "m-dashboard.png",
        SHOTS_DIR / "m-dashboard-dark.png",
        SHOTS_DIR / "m-budget-wedding.png",
        SHOTS_DIR / "m-guests.png",
        SHOTS_DIR / "m-reception.png",
        SHOTS_DIR / "m-rundown.png",
        SHOTS_DIR / "m-vendors.png",
        SHOTS_DIR / "m-seserahan.png",
    ]
    for ef in extra_files:
        if ef.exists():
            client.call("media_import", {"path": path_str, "file": str(ef)})

    # Render a preview frame from Concat's compositor to verify alignment
    prev = client.call("preview_frame", {"path": path_str, "time": 2.0})
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


def main():
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
        print("\nAll Concat projects created and saved!")
    finally:
        client.close()


if __name__ == "__main__":
    main()
