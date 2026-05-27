"""POST /api/auth -- verify shared password and return an HMAC session token."""

from __future__ import annotations

import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from _lib.auth import check_password, issue_token  # noqa: E402
from _lib.http import JsonHandler  # noqa: E402


class handler(JsonHandler):  # noqa: N801 -- Vercel expects lowercase "handler"
    def do_POST(self) -> None:  # noqa: N802
        body = self._read_json()
        submitted = (body.get("password") or "").strip()
        if not check_password(submitted):
            self._write_json(401, {"ok": False, "error": "wrong-password"})
            return
        token = issue_token()
        self._write_json(200, {"ok": True, "token": token})
