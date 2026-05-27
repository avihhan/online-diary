"""GET/POST/DELETE /api/thoughts -- shared thoughts log."""

from __future__ import annotations

import datetime as dt
import os
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from ulid import ULID  # noqa: E402

from _lib.auth import extract_bearer, verify_token  # noqa: E402
from _lib.http import JsonHandler  # noqa: E402
from _lib.sheets import (  # noqa: E402
    THOUGHTS_HEADERS,
    fetch_all,
    find_row_index_by_id,
    get_thoughts_ws,
)

VALID_USERS = {"avi", "gracelynn"}


class handler(JsonHandler):  # noqa: N801
    def _auth_ok(self) -> bool:
        return verify_token(extract_bearer(dict(self.headers)))

    def do_GET(self) -> None:  # noqa: N802
        try:
            ws = get_thoughts_ws()
            items = fetch_all(ws, THOUGHTS_HEADERS)
            items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
            self._write_json(200, {"ok": True, "items": items})
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        if not self._auth_ok():
            self._write_json(401, {"ok": False, "error": "unauthorized"})
            return
        body = self._read_json()
        text = (body.get("text") or "").strip()
        if len(text) > 4000:
            text = text[:4000]
        author = (body.get("author") or "").lower()
        if not text:
            self._write_json(400, {"ok": False, "error": "text-required"})
            return
        if author not in VALID_USERS:
            self._write_json(400, {"ok": False, "error": "bad-user"})
            return
        try:
            ws = get_thoughts_ws()
            new_id = str(ULID())
            created_at = dt.datetime.now(dt.timezone.utc).isoformat()
            ws.append_row(
                [new_id, text, author, created_at],
                value_input_option="USER_ENTERED",
            )
            self._write_json(
                200,
                {
                    "ok": True,
                    "item": {
                        "id": new_id,
                        "text": text,
                        "author": author,
                        "createdAt": created_at,
                    },
                },
            )
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})

    def do_DELETE(self) -> None:  # noqa: N802
        if not self._auth_ok():
            self._write_json(401, {"ok": False, "error": "unauthorized"})
            return
        item_id = (self._query().get("id") or "").strip()
        if not item_id:
            self._write_json(400, {"ok": False, "error": "id-required"})
            return
        try:
            ws = get_thoughts_ws()
            row_idx = find_row_index_by_id(ws, item_id)
            if row_idx <= 0:
                self._write_json(404, {"ok": False, "error": "not-found"})
                return
            ws.delete_rows(row_idx)
            self._write_json(200, {"ok": True})
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})
