import json
import os
from typing import Any, Dict, Iterable, List

import boto3
from botocore.exceptions import ClientError

from src.common.dynamodb import (
    delete_connection,
    list_connections_by_roles,
    list_connections_by_user,
)

_apigw_client = None


def _client():
    global _apigw_client
    if _apigw_client is None:
        endpoint = os.environ["WEBSOCKET_API_ENDPOINT"]
        _apigw_client = boto3.client(
            "apigatewaymanagementapi",
            endpoint_url=endpoint,
        )
    return _apigw_client


def _send_to_connection(connection_id: str, payload: Dict[str, Any]) -> None:
    data = json.dumps(payload).encode("utf-8")
    try:
        _client().post_to_connection(ConnectionId=connection_id, Data=data)
    except ClientError as exc:
        error = exc.response["Error"]["Code"]
        if error in {"GoneException", "410"}:
            delete_connection(connection_id)
        else:
            raise


def broadcast_to_roles(
    roles: Iterable[str],
    event_type: str,
    data: Dict[str, Any],
) -> None:
    connections = list_connections_by_roles(roles)
    _broadcast(connections, event_type, data)


def notify_user(email: str, event_type: str, data: Dict[str, Any]) -> None:
    connections = list_connections_by_user(email)
    _broadcast(connections, event_type, data)


def _broadcast(connections: List[Dict[str, Any]], event_type: str, data: Dict[str, Any]) -> None:
    payload = {"type": event_type, "data": data}
    for connection in connections:
        _send_to_connection(connection["connectionId"], payload)

