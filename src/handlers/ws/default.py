from typing import Any, Dict


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    return {
        "statusCode": 200,
        "body": "Mensajes personalizados no soportados. Conexión activa.",
    }

