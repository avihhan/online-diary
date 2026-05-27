"""Helpers for the BaseHTTPRequestHandler-style handlers used by Vercel."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler
from typing import Any
from urllib.parse import urlparse, parse_qs

# Ensure sibling _lib modules are importable when each function file runs.
import os
_LIB_PARENT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _LIB_PARENT not in sys.path:
    sys.path.insert(0, _LIB_PARENT)


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
}


class JsonHandler(BaseHTTPRequestHandler):
    """Base class with JSON + CORS helpers."""

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return

    def _write_json(self, status: int, body: Any) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(payload)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def _query(self) -> dict:
        parsed = urlparse(self.path)
        flat = {}
        for key, values in parse_qs(parsed.query, keep_blank_values=True).items():
            flat[key] = values[0] if values else ""
        return flat

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)
        self.end_headers()
