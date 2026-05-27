"""Local development HTTP server for the diary API.

Runs all `/api/*` endpoints using the same `handler` classes used by Vercel,
so the behavior in dev matches production exactly. Reads env vars from
`.env.local` via python-dotenv.

Usage (Windows PowerShell):
    python dev_server.py

Then in another terminal:
    npm run dev

Open http://localhost:5173 — the Vite dev server proxies `/api/*` to this
server on port 3001 (configured in vite.config.js).
"""

from __future__ import annotations

import os
import sys
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "api"))

try:
    from dotenv import load_dotenv
except ImportError:
    print("Missing dependency: python-dotenv. Run:")
    print("  pip install python-dotenv gspread google-auth python-ulid")
    sys.exit(1)

dotenv_path = os.path.join(HERE, ".env.local")
if not os.path.exists(dotenv_path):
    print(f"WARNING: {dotenv_path} not found. Backend will fail without env vars.")
load_dotenv(dotenv_path)

PORT = int(os.environ.get("DEV_API_PORT", "3001"))

# Import handlers (after env is loaded so module-level reads work).
from auth import handler as AuthHandler  # noqa: E402
from places import handler as PlacesHandler  # noqa: E402
from bucket import handler as BucketHandler  # noqa: E402
from thoughts import handler as ThoughtsHandler  # noqa: E402
from dates import handler as DatesHandler  # noqa: E402

ROUTES = {
    "/api/auth": AuthHandler,
    "/api/places": PlacesHandler,
    "/api/bucket": BucketHandler,
    "/api/thoughts": ThoughtsHandler,
    "/api/dates": DatesHandler,
}


class RouterHandler(BaseHTTPRequestHandler):
    """Dispatches an incoming request to the right Vercel-style handler class."""

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        sys.stderr.write(
            "[dev] %s - %s\n" % (self.address_string(), format % args)
        )

    def _dispatch(self) -> None:
        path = urlparse(self.path).path
        handler_cls = ROUTES.get(path)
        if not handler_cls:
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b'{"ok":false,"error":"route-not-found"}')
            return

        try:
            inner = handler_cls.__new__(handler_cls)
            inner.request = self.request
            inner.client_address = self.client_address
            inner.server = self.server
            inner.rfile = self.rfile
            inner.wfile = self.wfile
            inner.headers = self.headers
            inner.command = self.command
            inner.path = self.path
            inner.request_version = self.request_version
            inner.requestline = self.requestline
            inner.raw_requestline = b""

            method = f"do_{self.command}"
            fn = getattr(inner, method, None)
            if not fn:
                self.send_response(501)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(b'{"ok":false,"error":"method-not-implemented"}')
                return
            fn()
        except Exception as exc:
            import traceback
            traceback.print_exc()
            try:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(f'{{"ok":false,"error":"{exc}"}}'.encode("utf-8"))
            except Exception:
                pass

    def do_GET(self) -> None:  # noqa: N802
        self._dispatch()

    def do_POST(self) -> None:  # noqa: N802
        self._dispatch()

    def do_PATCH(self) -> None:  # noqa: N802
        self._dispatch()

    def do_DELETE(self) -> None:  # noqa: N802
        self._dispatch()

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._dispatch()


def main() -> None:
    required = ["DIARY_PASSWORD", "SESSION_SECRET", "SHEET_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        print("WARNING: Missing env vars:", ", ".join(missing))
        print("Auth/sheets calls will fail until these are set in .env.local")

    server = HTTPServer(("127.0.0.1", PORT), RouterHandler)
    print(f"[dev] Diary API listening on http://127.0.0.1:{PORT}")
    print("[dev] Routes:")
    for path in ROUTES:
        print(f"        {path}")
    print("[dev] Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[dev] shutting down")
        server.shutdown()


if __name__ == "__main__":
    main()
