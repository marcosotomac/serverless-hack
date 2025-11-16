import json
from time import time
from typing import Any, Dict

from src.common import auth
from src.common.dynamodb import get_user, put_user
from src.common.notifications import send_registration_email
from src.common.response import json_response


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    role_input = payload.get("role") or ""
    full_name = (payload.get("fullName") or "").strip()

    if not email or not password or not role_input:
        return json_response(
            400,
            {"message": "email, password y role son obligatorios"},
        )

    if len(password) < 8:
        return json_response(
            400,
            {"message": "La contraseña debe tener al menos 8 caracteres"},
        )

    try:
        auth.validate_institutional_email(email)
        role = auth.normalize_role(role_input)
    except ValueError as exc:
        return json_response(400, {"message": str(exc)})

    if get_user(email):
        return json_response(409, {"message": "El usuario ya existe"})

    password_hash = auth.hash_password(password)
    timestamp = int(time())
    item = {
        "email": email,
        "passwordHash": password_hash,
        "role": role,
        "fullName": full_name,
        "status": "active",
        "createdAt": timestamp,
        "updatedAt": timestamp,
    }
    put_user(item)
    send_registration_email(email=email, full_name=full_name, role=role)

    return json_response(
        201,
        {
            "message": "Usuario registrado",
            "user": {"email": email, "role": role, "fullName": full_name},
        },
    )
