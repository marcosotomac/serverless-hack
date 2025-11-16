from typing import Any, Dict

from src.common.dynamodb import get_incident
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        get_authenticated_claims(event)
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    incident_id = (event.get("pathParameters") or {}).get("incidentId")
    if not incident_id:
        return json_response(400, {"message": "incidentId es requerido"})

    incident = get_incident(incident_id)
    if not incident:
        return json_response(404, {"message": "Incidente no encontrado"})

    history = sorted(incident.get("history", []), key=lambda entry: entry.get("timestamp", 0))
    return json_response(
        200,
        {
            "incidentId": incident_id,
            "history": history,
        },
    )

