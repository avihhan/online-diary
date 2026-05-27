"""Google Sheets helper.

Reads service-account credentials and target sheet from environment variables and
returns ready-to-use gspread worksheet objects.

Env vars required:
- GOOGLE_SERVICE_ACCOUNT_JSON: the full service-account JSON as a single string
- SHEET_ID: the target Google Sheet ID
"""

from __future__ import annotations

import json
import os
import threading
from typing import Optional

import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

PLACES_TAB = "places"
BUCKET_TAB = "bucket_list"
THOUGHTS_TAB = "thoughts"
DATES_TAB = "dates"

PLACES_HEADERS = ["id", "title", "lat", "lng", "status", "addedBy", "createdAt"]
BUCKET_HEADERS = ["id", "text", "checked", "addedBy", "checkedBy", "createdAt"]
THOUGHTS_HEADERS = ["id", "text", "author", "createdAt"]
DATES_HEADERS = ["id", "title", "date", "notes", "addedBy", "createdAt"]

_client_lock = threading.Lock()
_client: Optional[gspread.Client] = None
_spreadsheet = None


def _build_client() -> gspread.Client:
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise RuntimeError("Missing GOOGLE_SERVICE_ACCOUNT_JSON env var")
    try:
        info = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: {exc}") from exc
    creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    return gspread.authorize(creds)


def get_client() -> gspread.Client:
    global _client
    with _client_lock:
        if _client is None:
            _client = _build_client()
        return _client


def get_spreadsheet():
    global _spreadsheet
    if _spreadsheet is None:
        sheet_id = os.environ.get("SHEET_ID")
        if not sheet_id:
            raise RuntimeError("Missing SHEET_ID env var")
        _spreadsheet = get_client().open_by_key(sheet_id)
    return _spreadsheet


def get_worksheet(title: str, headers: list[str]):
    sh = get_spreadsheet()
    try:
        ws = sh.worksheet(title)
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(title=title, rows=200, cols=max(8, len(headers)))
        ws.append_row(headers)
        return ws

    first_row = ws.row_values(1)
    if first_row != headers:
        ws.update("A1", [headers])
    return ws


def get_places_ws():
    return get_worksheet(PLACES_TAB, PLACES_HEADERS)


def get_bucket_ws():
    return get_worksheet(BUCKET_TAB, BUCKET_HEADERS)


def get_thoughts_ws():
    return get_worksheet(THOUGHTS_TAB, THOUGHTS_HEADERS)


def get_dates_ws():
    return get_worksheet(DATES_TAB, DATES_HEADERS)


def rows_to_dicts(rows: list[list[str]], headers: list[str]) -> list[dict]:
    out: list[dict] = []
    for row in rows:
        if not any(cell.strip() for cell in row if isinstance(cell, str)):
            continue
        item: dict = {}
        for i, key in enumerate(headers):
            item[key] = row[i] if i < len(row) else ""
        out.append(item)
    return out


def fetch_all(ws, headers: list[str]) -> list[dict]:
    values = ws.get_all_values()
    if not values:
        return []
    return rows_to_dicts(values[1:], headers)


def find_row_index_by_id(ws, item_id: str) -> int:
    """Return 1-based row index for the row whose first column equals item_id, or -1."""
    col = ws.col_values(1)
    for idx, value in enumerate(col, start=1):
        if value == item_id:
            return idx
    return -1
