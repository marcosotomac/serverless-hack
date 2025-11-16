"""
Handler para obtener lista de usuarios del personal
"""
from src.common.auth import authorize
from src.common.dynamodb import list_users_by_role
from src.common.response import json_response


@authorize(["autoridad"])
def handler(event, context):
    """
    Obtiene la lista de usuarios con rol 'personal'
    Solo puede ser consultado por autoridades
    """
    try:
        staff_users = list_users_by_role("personal")

        # Simplificar la respuesta solo con datos necesarios
        staff_list = [
            {
                "email": user["email"],
                "fullName": user.get("fullName", user["email"]),
            }
            for user in staff_users
        ]

        return json_response(200, {
            "staff": staff_list,
            "count": len(staff_list)
        })
    except Exception as e:
        return json_response(500, {"error": f"Error al obtener personal: {str(e)}"})
