"""
Handler para asignar incidentes a personal
"""
import json
from datetime import datetime
from src.common.auth import authorize
from src.common.dynamodb import get_incident, update_incident
from src.common.response import json_response
from src.common.websocket import broadcast_to_user, broadcast_to_roles
from src.common.notifications import notify_user


@authorize(["autoridad"])
def handler(event, context):
    """
    Asigna un incidente a un miembro del personal
    Solo puede ser realizado por autoridades
    """
    incident_id = event["pathParameters"]["incidentId"]
    claims = event["requestContext"]["authorizer"]["lambda"]
    
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return json_response(400, {"error": "JSON inválido"})
    
    assigned_to = body.get("assignedTo", "").strip()
    if not assigned_to:
        return json_response(400, {"error": "assignedTo es requerido"})
    
    # Obtener el incidente
    incident = get_incident(incident_id)
    if not incident:
        return json_response(404, {"error": "Incidente no encontrado"})
    
    # Crear entrada de historial
    timestamp = datetime.utcnow().isoformat()
    history_entry = {
        "action": "ASSIGNMENT",
        "by": claims["sub"],
        "role": claims["role"],
        "timestamp": timestamp,
        "details": f"Asignado a {assigned_to}"
    }
    
    # Actualizar el incidente
    updates = {
        "assignedTo": assigned_to,
        "updatedAt": timestamp
    }
    
    try:
        updated_incident = update_incident(incident_id, updates, history_entry)
    except Exception as e:
        return json_response(500, {"error": f"Error al asignar incidente: {str(e)}"})
    
    # Notificar al personal asignado
    notify_user(assigned_to, "incident.assigned", {
        "incident": updated_incident,
        "assignedBy": claims["sub"]
    })
    
    # Broadcast a otros usuarios del rol autoridad
    broadcast_to_roles({"autoridad"}, "incident.assigned", {
        "incident": updated_incident
    })
    
    # Broadcast al usuario asignado específicamente
    broadcast_to_user(assigned_to, "incident.assigned", {
        "incident": updated_incident
    })
    
    return json_response(200, {
        "message": "Incidente asignado correctamente",
        "incident": updated_incident
    })
