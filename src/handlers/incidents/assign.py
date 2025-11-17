"""
Handler para asignar incidentes a personal
"""
import json
import traceback
from datetime import datetime
from src.common.auth import authorize
from src.common.dynamodb import get_incident, update_incident, get_user
from src.common.response import json_response
from src.common.websocket import broadcast_to_roles, notify_user


@authorize(["autoridad"])
def handler(event, context):
    """
    Asigna un incidente a un miembro del personal
    Solo puede ser realizado por autoridades
    """
    try:
        incident_id = event["pathParameters"]["incidentId"]
        claims = event["requestContext"]["authorizer"]["lambda"]

        # Parsear body
        try:
            body = json.loads(event.get("body", "{}"))
        except json.JSONDecodeError:
            return json_response(400, {"error": "JSON inválido"})

        assigned_to = body.get("assignedTo", "").strip()
        if not assigned_to:
            return json_response(400, {"error": "assignedTo es requerido"})

        print(f"Attempting to assign incident {incident_id} to {assigned_to}")

        # Validar que el usuario asignado existe y es de rol "personal"
        assigned_user = get_user(assigned_to)
        if not assigned_user:
            print(f"User not found: {assigned_to}")
            return json_response(404, {"error": f"Usuario {assigned_to} no encontrado"})

        user_role = assigned_user.get("role")
        if user_role != "personal":
            print(f"Invalid role for assignment: {user_role}")
            return json_response(400, {
                "error": f"Solo se puede asignar a usuarios con rol 'personal'. El usuario {assigned_to} tiene rol '{user_role}'"
            })

        print(f"User validation passed: {assigned_to} is 'personal'")

        # Obtener el incidente
        incident = get_incident(incident_id)
        if not incident:
            print(f"Incident not found: {incident_id}")
            return json_response(404, {"error": "Incidente no encontrado"})

        print(
            f"Incident found: {incident.get('type')} at {incident.get('location')}")

        # Crear entrada de historial
        timestamp = datetime.utcnow().isoformat()
        history_entry = {
            "action": "ASSIGNMENT",
            "by": claims["sub"],
            "role": claims["role"],
            "timestamp": timestamp,
            "details": f"Asignado a {assigned_to}"
        }

        # Actualizar el incidente (updatedAt se maneja automáticamente)
        updates = {
            "assignedTo": assigned_to
        }

        print(f"Updating incident with: {updates}")
        updated_incident = update_incident(incident_id, updates, history_entry)
        print(f"Incident updated successfully")

        # Notificar al personal asignado vía WebSocket
        try:
            notify_user(assigned_to, "incident.assigned", {
                "incident": updated_incident,
                "assignedBy": claims["sub"],
                "message": "Se te ha asignado un nuevo incidente"
            })
            print(f"Notification sent to {assigned_to}")
        except Exception as e:
            print(f"Error enviando notificación al usuario: {e}")
            # No fallar si la notificación falla

        # Broadcast a otros usuarios del rol autoridad
        try:
            broadcast_to_roles({"autoridad"}, "incident.assigned", {
                "incident": updated_incident,
                "assignedTo": assigned_to
            })
            print("Broadcast sent to autoridades")
        except Exception as e:
            print(f"Error en broadcast a autoridades: {e}")
            # No fallar si el broadcast falla

        # Broadcast a personal también
        try:
            broadcast_to_roles({"personal"}, "incident.assigned", {
                "incident": updated_incident,
                "assignedTo": assigned_to
            })
            print("Broadcast sent to personal")
        except Exception as e:
            print(f"Error en broadcast a personal: {e}")

        return json_response(200, {
            "message": "Incidente asignado correctamente",
            "incident": updated_incident,
            "assignedTo": assigned_to
        })

    except Exception as e:
        print(f"Error in assign handler: {str(e)}")
        print(traceback.format_exc())
        return json_response(500, {
            "error": "Error interno del servidor",
            "details": str(e)
        })
