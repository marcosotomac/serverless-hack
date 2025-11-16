import json
from typing import Any, Dict

from src.common import auth
from src.common.dynamodb import get_user, update_last_login
from src.common.response import json_response


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return json_response(400, {"message": "email y password son requeridos"})

    user = get_user(email)
    if not user or not auth.verify_password(password, user.get("passwordHash", "")):
        return json_response(401, {"message": "Credenciales inválidas"})

    token = auth.issue_session_token(email=email, role=user["role"])
    update_last_login(email)

    return json_response(
        200,
        {
            "message": "Autenticación exitosa",
            "token": token,
            "user": {
                "email": user["email"],
                "role": user["role"],
                "fullName": user.get("fullName"),
            },
        },
    )
