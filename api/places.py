"""GET/POST/DELETE /api/places -- pins on the Mapbox world map."""

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
    PLACES_HEADERS,
    fetch_all,
    find_row_index_by_id,
    get_places_ws,
)

VALID_USERS = {"avi", "gracelynn"}
VALID_STATUS = {"visited", "want"}


def _normalize(item: dict) -> dict:
    try:
        item["lat"] = float(item.get("lat") or 0)
        item["lng"] = float(item.get("lng") or 0)
    except (TypeError, ValueError):
        item["lat"] = 0.0
        item["lng"] = 0.0
    return item


class handler(JsonHandler):  # noqa: N801
    def _auth_ok(self) -> bool:
        return verify_token(extract_bearer(dict(self.headers)))

    def do_GET(self) -> None:  # noqa: N802
        try:
            ws = get_places_ws()
            items = [_normalize(row) for row in fetch_all(ws, PLACES_HEADERS)]
            self._write_json(200, {"ok": True, "items": items})
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        if not self._auth_ok():
            self._write_json(401, {"ok": False, "error": "unauthorized"})
            return
        body = self._read_json()
        title = (body.get("title") or "").strip()[:120]
        try:
            lat = float(body.get("lat"))
            lng = float(body.get("lng"))
        except (TypeError, ValueError):
            self._write_json(400, {"ok": False, "error": "bad-coords"})
            return
        status = (body.get("status") or "want").lower()
        if status not in VALID_STATUS:
            status = "want"
        added_by = (body.get("addedBy") or "").lower()
        if added_by not in VALID_USERS:
            self._write_json(400, {"ok": False, "error": "bad-user"})
            return
        if not title:
            self._write_json(400, {"ok": False, "error": "title-required"})
            return

        try:
            ws = get_places_ws()
            new_id = str(ULID())
            created_at = dt.datetime.now(dt.timezone.utc).isoformat()
            row = [new_id, title, str(lat), str(lng), status, added_by, created_at]
            ws.append_row(row, value_input_option="USER_ENTERED")
            self._write_json(
                200,
                {
                    "ok": True,
                    "item": {
                        "id": new_id,
                        "title": title,
                        "lat": lat,
                        "lng": lng,
                        "status": status,
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
        status = (body.get("status") or "").lower()
        if not item_id or status not in VALID_STATUS:
            self._write_json(400, {"ok": False, "error": "bad-request"})
            return
        try:
            ws = get_places_ws()
            row_idx = find_row_index_by_id(ws, item_id)
            if row_idx <= 0:
                self._write_json(404, {"ok": False, "error": "not-found"})
                return
            status_col = PLACES_HEADERS.index("status") + 1
            ws.update_cell(row_idx, status_col, status)
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
            ws = get_places_ws()
            row_idx = find_row_index_by_id(ws, item_id)
            if row_idx <= 0:
                self._write_json(404, {"ok": False, "error": "not-found"})
                return
            ws.delete_rows(row_idx)
            self._write_json(200, {"ok": True})
        except Exception as exc:
            self._write_json(500, {"ok": False, "error": str(exc)})
