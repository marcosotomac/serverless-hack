import base64
import hashlib
import hmac
import json
import os
from time import time
from typing import Dict


ALLOWED_ROLES = {
    "estudiante",
    "personal",
    "autoridad",
}

ROLE_SYNONYMS = {
    "student": "estudiante",
    "alumno": "estudiante",
    "estudiantes": "estudiante",
    "staff": "personal",
    "personal administrativo": "personal",
    "authority": "autoridad",
}


def normalize_role(role: str) -> str:
    key = role.strip().lower()
    normalized = ROLE_SYNONYMS.get(key, key)
    if normalized not in ALLOWED_ROLES:
        raise ValueError(
            "Rol inválido. Usa uno de: estudiante, personal, autoridad."
        )
    return normalized


def validate_institutional_email(email: str) -> None:
    if "@utec.edu.pe" not in email.lower():
        raise ValueError("Solo se permiten correos institucionales @utec.edu.pe")


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 130000)
    return f"{_b64(salt)}.${_b64(key)}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_b64, hash_b64 = stored_hash.split("$")
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
    except Exception:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 130000)
    return hmac.compare_digest(candidate, expected)


def issue_session_token(email: str, role: str, ttl_seconds: int = 3600) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time())
    payload = {"sub": email, "role": role, "iat": now, "exp": now + ttl_seconds}
    secret = os.environ["AUTH_SECRET"].encode("utf-8")
    signing_input = ".".join(
        [_b64url(json.dumps(header, separators=(",", ":")).encode("utf-8")),
         _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))]
    )
    signature = hmac.new(secret, signing_input.encode("utf-8"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url(signature)}"


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

