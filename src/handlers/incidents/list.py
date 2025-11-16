from typing import Any, Dict

from src.common.dynamodb import list_incidents
from src.common.incidents import normalize_status
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        claims = get_authenticated_claims(event)
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    status_filter = None
    qs = event.get("queryStringParameters") or {}
    if qs.get("status"):
        try:
            status_filter = normalize_status(qs["status"])
        except ValueError as exc:
            return json_response(400, {"message": str(exc)})

    incidents = list_incidents([status_filter] if status_filter else None)
    if claims["role"] == "estudiante":
        incidents = [item for item in incidents if item.get("reportedBy") == claims["sub"]]

    return json_response(200, {"incidents": incidents})
