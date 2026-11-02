"""Static server for marketing screenshots.

Serves:
  /m/*  -> marketing/ (harness + slides)
  /*    -> dist/      (SPA, falls back to index.html)

Same origin for both so the harness iframes share localStorage with the app.
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(ROOT)
DIST = os.path.join(PROJECT, "dist")
MARKETING = ROOT


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        path = path.split("?", 1)[0].split("#", 1)[0]
        if path.startswith("/m/"):
            return os.path.join(MARKETING, path[3:].lstrip("/"))
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


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8125
    print(f"serving dist + marketing on http://127.0.0.1:{port}/  (marketing at /m/)")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
