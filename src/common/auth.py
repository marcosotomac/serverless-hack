import base64
import hashlib
import hmac
import json
import os
from functools import wraps
from time import time
from typing import Any, Callable, Dict, List


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
        raise ValueError(
            "Solo se permiten correos institucionales @utec.edu.pe")


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
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, 130000)
    return hmac.compare_digest(candidate, expected)


def issue_session_token(email: str, role: str, ttl_seconds: int = 3600) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time())
    payload = {"sub": email, "role": role,
               "iat": now, "exp": now + ttl_seconds}
    secret = os.environ["AUTH_SECRET"].encode("utf-8")
    signing_input = ".".join(
        [
            _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8")),
            _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
        ]
    )
    signature = hmac.new(secret, signing_input.encode(
        "utf-8"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url(signature)}"


def decode_session_token(token: str) -> Dict[str, Any]:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
    except ValueError as exc:
        raise ValueError("Token inválido") from exc

    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    secret = os.environ["AUTH_SECRET"].encode("utf-8")
    expected_signature = hmac.new(
        secret, signing_input, hashlib.sha256).digest()
    provided_signature = _b64url_decode(signature_b64)
    if not hmac.compare_digest(expected_signature, provided_signature):
        raise ValueError("Token inválido")

    payload = json.loads(_b64url_decode(payload_b64))
    if payload.get("exp", 0) < int(time()):
        raise ValueError("Token expirado")
    return payload


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def authorize(allowed_roles: List[str]):
    """
    Decorador para autorizar funciones Lambda basado en roles

    Args:
        allowed_roles: Lista de roles permitidos (ej: ["autoridad", "personal"])

    Returns:
        Decorador que valida el token JWT y verifica el rol

    Example:
        @authorize(["autoridad"])
        def handler(event, context):
            # Solo usuarios con rol 'autoridad' pueden acceder
            pass
    """
    def decorator(handler_func: Callable):
        @wraps(handler_func)
        def wrapper(event, context):
            # Obtener el token del header Authorization
            headers = event.get("headers", {})
            auth_header = headers.get(
                "authorization") or headers.get("Authorization")

            if not auth_header:
                return {
                    "statusCode": 401,
                    "body": json.dumps({"error": "Token de autorización requerido"})
                }

            # Extraer el token (formato: "Bearer <token>")
            try:
                token = auth_header.split(
                    " ")[1] if " " in auth_header else auth_header
            except IndexError:
                return {
                    "statusCode": 401,
                    "body": json.dumps({"error": "Formato de token inválido"})
                }

            # Decodificar y validar el token
            try:
                claims = decode_session_token(token)
            except ValueError as e:
                return {
                    "statusCode": 401,
                    "body": json.dumps({"error": str(e)})
                }

            # Verificar el rol
            user_role = claims.get("role")
            if user_role not in allowed_roles:
                return {
                    "statusCode": 403,
                    "body": json.dumps({
                        "error": f"Acceso denegado. Requiere uno de los roles: {', '.join(allowed_roles)}"
                    })
                }

            # Agregar claims al contexto del evento para que el handler pueda usarlos
            if "requestContext" not in event:
                event["requestContext"] = {}
            if "authorizer" not in event["requestContext"]:
                event["requestContext"]["authorizer"] = {}
            event["requestContext"]["authorizer"]["lambda"] = claims

            # Ejecutar el handler original
            return handler_func(event, context)

        return wrapper
    return decorator
