"""GET/POST/PATCH/DELETE /api/dates -- important dates the couple cares about."""

from __future__ import annotations

import datetime as dt
import os
import re
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from ulid import ULID  # noqa: E402

from _lib.auth import extract_bearer, verify_token  # noqa: E402
from _lib.http import JsonHandler  # noqa: E402
from _lib.sheets import (  # noqa: E402
    DATES_HEADERS,
    fetch_all,
    find_row_index_by_id,
    get_dates_ws,
)

VALID_USERS = {"avi", "gracelynn"}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _valid_date(s: str) -> bool:
    if not s or not DATE_RE.match(s):
        return False
    try:
        dt.date.fromisoformat(s)
        return True
    except ValueError:
        return False


class handler(JsonHandler):  # noqa: N801
    def _auth_ok(self) -> bool:
        return verify_token(extract_bearer(dict(self.headers)))

    def do_GET(self) -> None:  # noqa: N802
        try:
            ws = get_dates_ws()
            items = fetch_all(ws, DATES_HEADERS)
            items.sort(key=lambda x: x.get("date", ""))
            self._write_json(200, {"ok": True, "items": items})
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        if not self._auth_ok():
            self._write_json(401, {"ok": False, "error": "unauthorized"})
            return
        body = self._read_json()
        title = (body.get("title") or "").strip()[:120]
        date = (body.get("date") or "").strip()
        notes = (body.get("notes") or "").strip()[:300]
        added_by = (body.get("addedBy") or "").lower()

        if not title:
            self._write_json(400, {"ok": False, "error": "title-required"})
            return
        if not _valid_date(date):
            self._write_json(400, {"ok": False, "error": "bad-date"})
            return
        if added_by not in VALID_USERS:
            self._write_json(400, {"ok": False, "error": "bad-user"})
            return

        try:
            ws = get_dates_ws()
            new_id = str(ULID())
            created_at = dt.datetime.now(dt.timezone.utc).isoformat()
            row = [new_id, title, date, notes, added_by, created_at]
            ws.append_row(row, value_input_option="USER_ENTERED")
            self._write_json(
                200,
                {
                    "ok": True,
                    "item": {
                        "id": new_id,
                        "title": title,
                        "date": date,
                        "notes": notes,
                        "addedBy": added_by,
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

        updates: dict[str, str] = {}
        if "title" in body:
            title = (body.get("title") or "").strip()[:120]
            if not title:
                self._write_json(400, {"ok": False, "error": "title-required"})
                return
            updates["title"] = title
        if "date" in body:
            date = (body.get("date") or "").strip()
            if not _valid_date(date):
                self._write_json(400, {"ok": False, "error": "bad-date"})
                return
            updates["date"] = date
        if "notes" in body:
            updates["notes"] = (body.get("notes") or "").strip()[:300]

        if not updates:
            self._write_json(400, {"ok": False, "error": "no-fields"})
            return

        try:
            ws = get_dates_ws()
            row_idx = find_row_index_by_id(ws, item_id)
            if row_idx <= 0:
                self._write_json(404, {"ok": False, "error": "not-found"})
                return
            for field, value in updates.items():
                col = DATES_HEADERS.index(field) + 1
                ws.update_cell(row_idx, col, value)
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
            ws = get_dates_ws()
            row_idx = find_row_index_by_id(ws, item_id)
            if row_idx <= 0:
                self._write_json(404, {"ok": False, "error": "not-found"})
                return
            ws.delete_rows(row_idx)
            self._write_json(200, {"ok": True})
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})
