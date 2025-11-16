from collections import Counter
from typing import Any, Dict, List, Optional

from src.common.dynamodb import list_incidents
from src.common.incidents import normalize_priority, normalize_status, normalize_urgency
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims

# Changed to None to get all incidents by default
DEFAULT_ACTIVE_STATUSES = None
PRIORITY_WEIGHTS = {"critica": 4, "alta": 3, "media": 2, "baja": 1}


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        get_authenticated_claims(event, allowed_roles={
                                 "personal", "autoridad"})
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    params = event.get("queryStringParameters") or {}
    statuses = _parse_list_param(params.get(
        "status"), normalize_status, DEFAULT_ACTIVE_STATUSES)
    urgencies = _parse_list_param(params.get("urgency"), normalize_urgency)
    priorities = _parse_list_param(params.get("priority"), normalize_priority)

    incidents = list_incidents(statuses)
    incidents = _apply_filters(incidents, urgencies, priorities)
    incidents.sort(
        key=lambda item: (
            PRIORITY_WEIGHTS.get(item.get("priority", "media"), 2),
            item.get("createdAt", 0),
        ),
        reverse=True,
    )

    stats = Counter(incident.get("status", "desconocido")
                    for incident in incidents)
    summary = {status: stats.get(status, 0) for status in [
        "pendiente", "en_atencion", "resuelto"]}

    return json_response(
        200,
        {
            "filters": {
                "status": statuses,
                "urgency": urgencies,
                "priority": priorities,
            },
            "stats": summary,
            "incidents": incidents,
        },
    )


def _parse_list_param(value: Optional[str], normalizer, default: Optional[List[str]] = None) -> Optional[List[str]]:
    if not value:
        return default
    entries = [item.strip() for item in value.split(",") if item.strip()]
    normalized = [normalizer(entry) for entry in entries]
    return normalized


def _apply_filters(
    incidents: List[Dict[str, Any]],
    urgencies: Optional[List[str]],
    priorities: Optional[List[str]],
) -> List[Dict[str, Any]]:
    def matches(incident: Dict[str, Any]) -> bool:
        if urgencies and incident.get("urgency") not in urgencies:
            return False
        if priorities and incident.get("priority") not in priorities:
            return False
        return True

    return [incident for incident in incidents if matches(incident)]
