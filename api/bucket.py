"""GET/POST/PATCH/DELETE /api/bucket -- shared date-idea checklist."""

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
    BUCKET_HEADERS,
    fetch_all,
    find_row_index_by_id,
    get_bucket_ws,
)

VALID_USERS = {"avi", "gracelynn"}


def _coerce_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    if isinstance(value, str):
        return value.strip().lower() in {"true", "1", "yes", "y", "checked"}
    return False


def _normalize(item: dict) -> dict:
    item["checked"] = _coerce_bool(item.get("checked"))
    return item


class handler(JsonHandler):  # noqa: N801
    def _auth_ok(self) -> bool:
        return verify_token(extract_bearer(dict(self.headers)))

    def do_GET(self) -> None:  # noqa: N802
        try:
            ws = get_bucket_ws()
            items = [_normalize(row) for row in fetch_all(ws, BUCKET_HEADERS)]
            self._write_json(200, {"ok": True, "items": items})
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        if not self._auth_ok():
            self._write_json(401, {"ok": False, "error": "unauthorized"})
            return
        body = self._read_json()
        text = (body.get("text") or "").strip()[:240]
        added_by = (body.get("addedBy") or "").lower()
        if not text:
            self._write_json(400, {"ok": False, "error": "text-required"})
            return
        if added_by not in VALID_USERS:
            self._write_json(400, {"ok": False, "error": "bad-user"})
            return
        try:
            ws = get_bucket_ws()
            new_id = str(ULID())
            created_at = dt.datetime.now(dt.timezone.utc).isoformat()
            row = [new_id, text, "false", added_by, "", created_at]
            ws.append_row(row, value_input_option="USER_ENTERED")
            self._write_json(
                200,
                {
                    "ok": True,
                    "item": {
                        "id": new_id,
                        "text": text,
                        "checked": False,
                        "addedBy": added_by,
                        "checkedBy": "",
                        "createdAt": created_at,
                    },
                },
            )
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})

    def do_PATCH(self) -> None:  # noqa: N802
        if not self._auth_ok():
            self._write_json(401, {"ok": False, "error": "unauthorized"})
            return
        body = self._read_json()
        item_id = (body.get("id") or "").strip()
        if not item_id:
            self._write_json(400, {"ok": False, "error": "id-required"})
            return
        checked = _coerce_bool(body.get("checked"))
        checked_by = (body.get("checkedBy") or "").lower()
        if checked and checked_by not in VALID_USERS:
            self._write_json(400, {"ok": False, "error": "bad-user"})
            return
        try:
            ws = get_bucket_ws()
            row_idx = find_row_index_by_id(ws, item_id)
            if row_idx <= 0:
                self._write_json(404, {"ok": False, "error": "not-found"})
                return
            checked_col = BUCKET_HEADERS.index("checked") + 1
            checked_by_col = BUCKET_HEADERS.index("checkedBy") + 1
            ws.update_cell(row_idx, checked_col, "true" if checked else "false")
            ws.update_cell(row_idx, checked_by_col, checked_by if checked else "")
            self._write_json(200, {"ok": True})
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
            ws = get_bucket_ws()
            row_idx = find_row_index_by_id(ws, item_id)
            if row_idx <= 0:
                self._write_json(404, {"ok": False, "error": "not-found"})
                return
            ws.delete_rows(row_idx)
            self._write_json(200, {"ok": True})
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})
