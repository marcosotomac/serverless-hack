import json
from time import time
from typing import Any, Dict

from src.common.dynamodb import get_incident, update_incident
from src.common.incidents import normalize_priority
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims
from src.common.websocket import broadcast_to_roles, notify_user


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        claims = get_authenticated_claims(event, allowed_roles={"autoridad"})
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    incident_id = (event.get("pathParameters") or {}).get("incidentId")
    if not incident_id:
        return json_response(400, {"message": "incidentId es requerido"})

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    if not payload.get("priority"):
        return json_response(400, {"message": "priority es requerido"})

    try:
        priority = normalize_priority(payload["priority"])
    except ValueError as exc:
        return json_response(400, {"message": str(exc)})

    note = (payload.get("note") or "").strip()
    incident = get_incident(incident_id)
    if not incident:
        return json_response(404, {"message": "Incidente no encontrado"})

    history_entry = {
        "action": "PRIORITY_CHANGE",
        "by": claims["sub"],
        "role": claims["role"],
        "timestamp": int(time()),
        "priority": priority,
    }
    if note:
        history_entry["note"] = note

    attributes = {"priority": priority}
    if note:
        attributes["lastNote"] = note

    updated_incident = update_incident(incident_id, attributes, history_entry)
    broadcast_to_roles({"personal", "autoridad"}, "incident.priority", {"incident": updated_incident})
    reporter = updated_incident.get("reportedBy")
    if reporter:
        notify_user(reporter, "incident.priority", {"incident": updated_incident})

    return json_response(
        200,
        {"message": "Prioridad actualizada", "incident": updated_incident},
    )

