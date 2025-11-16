import json
from time import time
from typing import Any, Dict
from uuid import uuid4

from src.common.dynamodb import add_incident_comment, get_incident
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims
from src.common.websocket import broadcast_to_roles, notify_user


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        claims = get_authenticated_claims(event)
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    if claims.get("role") != "estudiante":
        return json_response(403, {"message": "Solo los usuarios pueden comentar incidentes"})

    incident_id = (event.get("pathParameters") or {}).get("incidentId")
    if not incident_id:
        return json_response(400, {"message": "incidentId es requerido"})

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    text = (payload.get("text") or "").strip()
    if not text:
        return json_response(400, {"message": "El comentario no puede estar vacío"})

    if not get_incident(incident_id):
        return json_response(404, {"message": "Incidente no encontrado"})

    timestamp = int(time())
    comment_entry = {
        "commentId": str(uuid4()),
        "text": text,
        "by": claims["sub"],
        "role": claims["role"],
        "timestamp": timestamp,
    }
    history_entry = {
        "action": "COMMENT",
        "by": claims["sub"],
        "role": claims["role"],
        "timestamp": timestamp,
        "note": text,
    }
    updated_incident = add_incident_comment(incident_id, comment_entry, history_entry)

    broadcast_to_roles(
        {"personal", "autoridad"},
        "incident.comment",
        {"incidentId": incident_id, "comment": comment_entry},
    )
    reporter = updated_incident.get("reportedBy")
    if reporter and reporter != claims["sub"]:
        notify_user(reporter, "incident.comment", {"incidentId": incident_id, "comment": comment_entry})

    return json_response(
        201,
        {"message": "Comentario agregado", "comment": comment_entry, "incident": {"incidentId": incident_id, "comments": updated_incident.get("comments", [])}},
    )
