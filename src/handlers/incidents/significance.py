from time import time
from typing import Any, Dict

from src.common.dynamodb import add_significance_vote, get_incident
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims
from src.common.websocket import broadcast_to_roles, notify_user


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        claims = get_authenticated_claims(event)
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    incident_id = (event.get("pathParameters") or {}).get("incidentId")
    if not incident_id:
        return json_response(400, {"message": "incidentId es requerido"})

    incident = get_incident(incident_id)
    if not incident:
        return json_response(404, {"message": "Incidente no encontrado"})

    history_entry = {
        "action": "SIGNIFICANCE_UPVOTE",
        "by": claims["sub"],
        "role": claims["role"],
        "timestamp": int(time()),
    }
    try:
        updated_incident = add_significance_vote(incident_id, claims["sub"], history_entry)
    except ValueError as exc:
        return json_response(409, {"message": str(exc)})

    broadcast_to_roles(
        {"personal", "autoridad"},
        "incident.significance",
        {"incidentId": incident_id, "significanceCount": updated_incident.get("significanceCount", 0)},
    )
    reporter = incident.get("reportedBy")
    if reporter and reporter != claims["sub"]:
        notify_user(
            reporter,
            "incident.significance",
            {"incidentId": incident_id, "significanceCount": updated_incident.get("significanceCount", 0)},
        )

    return json_response(
        200,
        {
            "message": "Significancia registrada",
            "significanceCount": updated_incident.get("significanceCount", 0),
        },
    )
