import os
from typing import Any, Dict

from src.common.auth import decode_session_token
from src.common.dynamodb import save_connection


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    params = event.get("queryStringParameters") or {}
    token = (params.get("token") or "").strip()
    if not token:
        return {"statusCode": 401, "body": "Token requerido en querystring (?token=...)"}
    try:
        claims = decode_session_token(token)
    except ValueError as exc:
        return {"statusCode": 401, "body": str(exc)}

    connection_id = event["requestContext"]["connectionId"]
    ttl_seconds = int(os.environ.get("CONNECTION_TTL_SECONDS", "3600"))
    save_connection(connection_id, user=claims["sub"], role=claims["role"], ttl_seconds=ttl_seconds)
    return {"statusCode": 200, "body": "Conectado"}
