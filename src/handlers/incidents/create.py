import json
from time import time
from typing import Any, Dict
from uuid import uuid4

from src.common.dynamodb import put_incident
from src.common.incidents import normalize_urgency
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims
from src.common.websocket import broadcast_to_roles, notify_user


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        claims = get_authenticated_claims(event)
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    required_fields = ["type", "location", "description", "urgency"]
    missing = [field for field in required_fields if not (payload.get(field) or "").strip()]
    if missing:
        return json_response(400, {"message": f"Faltan campos: {', '.join(missing)}"})

    try:
        urgency = normalize_urgency(payload["urgency"])
    except ValueError as exc:
        return json_response(400, {"message": str(exc)})

    incident_id = str(uuid4())
    timestamp = int(time())
    note = (payload.get("note") or "").strip()
    history_entry = {
        "action": "CREATED",
        "by": claims["sub"],
        "role": claims["role"],
        "timestamp": timestamp,
    }
    if note:
        history_entry["note"] = note
    incident_item = {
        "incidentId": incident_id,
        "type": payload["type"].strip(),
        "location": payload["location"].strip(),
        "description": payload["description"].strip(),
        "urgency": urgency,
        "priority": urgency,
        "status": "pendiente",
        "reportedBy": claims["sub"],
        "reporterRole": claims["role"],
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "history": [history_entry],
    }
    if note:
        incident_item["lastNote"] = note
    put_incident(incident_item)
    broadcast_to_roles({"personal", "autoridad"}, "incident.created", {"incident": incident_item})
    notify_user(claims["sub"], "incident.created", {"incident": incident_item})

    return json_response(
        201,
        {"message": "Incidente registrado", "incident": incident_item},
    )
