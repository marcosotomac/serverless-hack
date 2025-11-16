from typing import Iterable, Optional

from src.common.auth import decode_session_token


class AuthError(Exception):
    """Raised when an authorization header is missing or invalid."""


def get_authenticated_claims(event, allowed_roles: Optional[Iterable[str]] = None):
    headers = event.get("headers") or {}
    auth_header = headers.get("Authorization") or headers.get("authorization")
    if not auth_header:
        raise AuthError("Encabezado Authorization requerido")
    parts = auth_header.split(" ", 1)
    token = parts[1] if len(parts) == 2 else parts[0]
    token = token.strip()
    if not token:
        raise AuthError("Token inválido")
    claims = decode_session_token(token)
    if allowed_roles and claims.get("role") not in allowed_roles:
        raise AuthError("No autorizado para esta operación")
    return claims
