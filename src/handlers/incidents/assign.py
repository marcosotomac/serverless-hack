"""
Handler para asignar incidentes a personal
"""
import json
from datetime import datetime
from src.common.auth import authorize
from src.common.dynamodb import get_incident, update_incident, get_user
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

    # Validar que el usuario asignado existe y es de rol "personal"
    try:
        assigned_user = get_user(assigned_to)
        if not assigned_user:
            return json_response(404, {"error": f"Usuario {assigned_to} no encontrado"})
        
        if assigned_user.get("role") != "personal":
            return json_response(400, {
                "error": f"Solo se puede asignar a usuarios con rol 'personal'. El usuario {assigned_to} tiene rol '{assigned_user.get('role')}'"
            })
    except Exception as e:
        return json_response(500, {"error": f"Error al validar usuario: {str(e)}"})

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
    try:
        notify_user(assigned_to, "incident.assigned", {
            "incident": updated_incident,
            "assignedBy": claims["sub"]
        })
    except Exception as e:
        # No fallar si la notificación falla
        print(f"Error enviando notificación: {e}")

    # Broadcast a otros usuarios del rol autoridad
    try:
        broadcast_to_roles({"autoridad"}, "incident.assigned", {
            "incident": updated_incident
        })
    except Exception as e:
        print(f"Error en broadcast a autoridades: {e}")

    # Broadcast al usuario asignado específicamente
    try:
        broadcast_to_user(assigned_to, "incident.assigned", {
            "incident": updated_incident
        })
    except Exception as e:
        print(f"Error en broadcast al usuario asignado: {e}")

    return json_response(200, {
        "message": "Incidente asignado correctamente",
        "incident": updated_incident
    })
