import os
from typing import Any, Dict

from src.common.dynamodb import touch_connection


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    connection_id = event["requestContext"]["connectionId"]
    ttl_seconds = int(os.environ.get("CONNECTION_TTL_SECONDS", "3600"))
    touch_connection(connection_id, ttl_seconds)
    return {"statusCode": 200, "body": "pong"}

