from typing import Any, Dict

from src.common.dynamodb import delete_connection


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    connection_id = event["requestContext"]["connectionId"]
    delete_connection(connection_id)
    return {"statusCode": 200, "body": "Desconectado"}

