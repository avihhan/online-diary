"""Lightweight HMAC session tokens.

The diary uses a single shared password (DIARY_PASSWORD). When the user submits
the correct password, the backend returns a signed token of the form
``<payload_b64>.<sig_b64>`` where payload is JSON containing an issued-at
timestamp. The token is verified on every protected mutation.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time

TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days


def _secret() -> bytes:
    secret = os.environ.get("SESSION_SECRET")
    if not secret:
        raise RuntimeError("Missing SESSION_SECRET env var")
    return secret.encode("utf-8")


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(text: str) -> bytes:
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def check_password(submitted: str) -> bool:
    expected = os.environ.get("DIARY_PASSWORD")
    if not expected:
        return False
    return hmac.compare_digest(submitted or "", expected)


def issue_token() -> str:
    payload = {"iat": int(time.time())}
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = hmac.new(_secret(), payload_bytes, hashlib.sha256).digest()
    return f"{_b64url_encode(payload_bytes)}.{_b64url_encode(sig)}"


def verify_token(token: str) -> bool:
    if not token or "." not in token:
        return False
    try:
        payload_b64, sig_b64 = token.split(".", 1)
        payload_bytes = _b64url_decode(payload_b64)
        sig = _b64url_decode(sig_b64)
    except Exception:
        return False

    expected_sig = hmac.new(_secret(), payload_bytes, hashlib.sha256).digest()
    if not hmac.compare_digest(sig, expected_sig):
        return False

    try:
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        return False

    issued_at = payload.get("iat", 0)
    if not isinstance(issued_at, int):
        return False
    if time.time() - issued_at > TOKEN_TTL_SECONDS:
        return False
    return True


def extract_bearer(headers: dict) -> str:
    if not headers:
        return ""
    raw = headers.get("authorization") or headers.get("Authorization") or ""
    if raw.lower().startswith("bearer "):
        return raw[7:].strip()
    return raw.strip()
