import json
from time import time
from typing import Any, Dict

from src.common.dynamodb import get_incident, update_incident
from src.common.incidents import normalize_status
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims
from src.common.websocket import broadcast_to_roles, notify_user


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        claims = get_authenticated_claims(event, allowed_roles={"personal", "autoridad"})
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    incident_id = (event.get("pathParameters") or {}).get("incidentId")
    if not incident_id:
        return json_response(400, {"message": "incidentId es requerido en la ruta"})

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    if not payload.get("status"):
        return json_response(400, {"message": "status es requerido"})

    try:
        status = normalize_status(payload["status"])
    except ValueError as exc:
        return json_response(400, {"message": str(exc)})

    note = (payload.get("note") or "").strip()

    incident = get_incident(incident_id)
    if not incident:
        return json_response(404, {"message": "Incidente no encontrado"})

    history_entry = {
        "action": "STATUS_CHANGE",
        "by": claims["sub"],
        "role": claims["role"],
        "timestamp": int(time()),
        "newStatus": status,
    }
    if note:
        history_entry["note"] = note
    attributes = {"status": status}
    if note:
        attributes["lastNote"] = note

    updated_incident = update_incident(incident_id, attributes, history_entry)

    broadcast_to_roles({"personal", "autoridad"}, "incident.updated", {"incident": updated_incident})
    reporter = updated_incident.get("reportedBy")
    if reporter:
        notify_user(reporter, "incident.updated", {"incident": updated_incident})

    return json_response(200, {"message": "Incidente actualizado", "incident": updated_incident})
