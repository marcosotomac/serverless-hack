import os
from functools import lru_cache
from time import time
from typing import Any, Dict, Iterable, List, Optional

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError


@lru_cache(maxsize=1)
def _resource():
    return boto3.resource("dynamodb")


@lru_cache(maxsize=1)
def _users_table():
    table_name = os.environ["USERS_TABLE"]
    return _resource().Table(table_name)


@lru_cache(maxsize=1)
def _incidents_table():
    table_name = os.environ["INCIDENTS_TABLE"]
    return _resource().Table(table_name)


@lru_cache(maxsize=1)
def _connections_table():
    table_name = os.environ["CONNECTIONS_TABLE"]
    return _resource().Table(table_name)


def put_user(item: Dict[str, Any]) -> None:
    table = _users_table()
    table.put_item(Item=item)


def get_user(email: str) -> Optional[Dict[str, Any]]:
    table = _users_table()
    response = table.get_item(Key={"email": email})
    return response.get("Item")


def update_last_login(email: str) -> None:
    table = _users_table()
    table.update_item(
        Key={"email": email},
        UpdateExpression="SET lastLoginAt = :ts",
        ExpressionAttributeValues={":ts": int(time())},
    )


def put_incident(item: Dict[str, Any]) -> None:
    table = _incidents_table()
    table.put_item(Item=item)


def get_incident(incident_id: str) -> Optional[Dict[str, Any]]:
    table = _incidents_table()
    response = table.get_item(Key={"incidentId": incident_id})
    return response.get("Item")


def list_incidents(statuses: Optional[Iterable[str]] = None) -> List[Dict[str, Any]]:
    table = _incidents_table()
    items: List[Dict[str, Any]] = []
    if statuses:
        for status in statuses:
            kwargs: Dict[str, Any] = {
                "IndexName": "status-index",
                "KeyConditionExpression": Key("status").eq(status),
            }
            while True:
                response = table.query(**kwargs)
                items.extend(response.get("Items", []))
                last_key = response.get("LastEvaluatedKey")
                if not last_key:
                    break
                kwargs["ExclusiveStartKey"] = last_key
    else:
        kwargs = {}
        while True:
            response = table.scan(**kwargs)
            items.extend(response.get("Items", []))
            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break
            kwargs["ExclusiveStartKey"] = last_key
    return items


def update_incident(
    incident_id: str,
    attributes: Dict[str, Any],
    history_entry: Dict[str, Any],
) -> Dict[str, Any]:
    table = _incidents_table()
    attr_names: Dict[str, str] = {}
    attr_values: Dict[str, Any] = {
        ":ts": int(time()),
        ":historyEntry": [history_entry],
        ":emptyList": [],
    }
    set_parts = []
    for idx, (key, value) in enumerate(attributes.items()):
        placeholder_name = f"#attr{idx}"
        placeholder_value = f":val{idx}"
        attr_names[placeholder_name] = key
        attr_values[placeholder_value] = value
        set_parts.append(f"{placeholder_name} = {placeholder_value}")

    set_parts.append("updatedAt = :ts")
    set_parts.append(
        "history = list_append(if_not_exists(history, :emptyList), :historyEntry)")

    update_expression = "SET " + ", ".join(set_parts)
    update_kwargs = {
        "Key": {"incidentId": incident_id},
        "UpdateExpression": update_expression,
        "ExpressionAttributeValues": attr_values,
        "ConditionExpression": "attribute_exists(incidentId)",
        "ReturnValues": "ALL_NEW",
    }
    if attr_names:
        update_kwargs["ExpressionAttributeNames"] = attr_names
    response = table.update_item(**update_kwargs)
    return response["Attributes"]


def save_connection(connection_id: str, user: str, role: str, ttl_seconds: int) -> None:
    table = _connections_table()
    expires_at = int(time()) + ttl_seconds
    table.put_item(
        Item={
            "connectionId": connection_id,
            "user": user,
            "role": role,
            "connectedAt": int(time()),
            "lastPingAt": int(time()),
            "expiresAt": expires_at,
        }
    )


def delete_connection(connection_id: str) -> None:
    table = _connections_table()
    table.delete_item(Key={"connectionId": connection_id})


def touch_connection(connection_id: str, ttl_seconds: int) -> None:
    table = _connections_table()
    expires_at = int(time()) + ttl_seconds
    table.update_item(
        Key={"connectionId": connection_id},
        UpdateExpression="SET lastPingAt = :now, expiresAt = :expiresAt",
        ExpressionAttributeValues={
            ":now": int(time()),
            ":expiresAt": expires_at,
        },
    )


def list_connections_by_roles(roles: Iterable[str]) -> List[Dict[str, Any]]:
    table = _connections_table()
    items: List[Dict[str, Any]] = []
    for role in roles:
        response = table.query(
            IndexName="role-index",
            KeyConditionExpression=Key("role").eq(role),
        )
        items.extend(response.get("Items", []))
    return items


def list_connections_by_user(user: str) -> List[Dict[str, Any]]:
    table = _connections_table()
    response = table.query(
        IndexName="user-index",
        KeyConditionExpression=Key("user").eq(user),
    )
    return response.get("Items", [])


def add_incident_comment(
    incident_id: str,
    comment_entry: Dict[str, Any],
    history_entry: Dict[str, Any],
) -> Dict[str, Any]:
    table = _incidents_table()
    now = int(time())
    response = table.update_item(
        Key={"incidentId": incident_id},
        UpdateExpression=(
            "SET comments = list_append(if_not_exists(comments, :emptyList), :commentList), "
            "updatedAt = :ts, "
            "history = list_append(if_not_exists(history, :emptyList), :historyEntry)"
        ),
        ExpressionAttributeValues={
            ":commentList": [comment_entry],
            ":historyEntry": [history_entry],
            ":emptyList": [],
            ":ts": now,
        },
        ConditionExpression="attribute_exists(incidentId)",
        ReturnValues="ALL_NEW",
    )
    return response["Attributes"]


def add_significance_vote(
    incident_id: str,
    voter: str,
    history_entry: Dict[str, Any],
) -> Dict[str, Any]:
    table = _incidents_table()
    now = int(time())

    # Primero obtenemos el incidente para verificar si ya votó
    incident = get_incident(incident_id)
    if not incident:
        raise ValueError("Incidente no encontrado")

    # Verificar si el usuario ya votó
    voters = incident.get("significanceVoters", set())
    if isinstance(voters, list):
        voters = set(voters)
    if voter in voters:
        raise ValueError(
            "El usuario ya marcó este incidente como significativo")

    try:
        response = table.update_item(
            Key={"incidentId": incident_id},
            UpdateExpression=(
                "SET updatedAt = :ts, "
                "history = list_append(if_not_exists(history, :emptyList), :historyEntry) "
                "ADD significanceCount :one, significanceVoters :voterSet"
            ),
            ExpressionAttributeValues={
                ":ts": now,
                ":historyEntry": [history_entry],
                ":emptyList": [],
                ":one": 1,
                ":voterSet": {voter},
            },
            ConditionExpression="attribute_exists(incidentId)",
            ReturnValues="ALL_NEW",
        )
        return response["Attributes"]
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            raise ValueError("Incidente no encontrado") from exc
        raise


def list_users_by_role(role: str) -> List[Dict[str, Any]]:
    """
    Lista todos los usuarios con un rol específico
    """
    table = _users_table()
    response = table.scan(
        FilterExpression="attribute_exists(#role) AND #role = :role",
        ExpressionAttributeNames={"#role": "role"},
        ExpressionAttributeValues={":role": role}
    )
    return response.get("Items", [])
