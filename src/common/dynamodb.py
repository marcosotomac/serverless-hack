import os
from functools import lru_cache
from time import time
from typing import Any, Dict, Iterable, List, Optional

import boto3
from boto3.dynamodb.conditions import Key


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


def list_incidents(status: Optional[str] = None) -> List[Dict[str, Any]]:
    table = _incidents_table()
    items: List[Dict[str, Any]] = []
    if status:
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
    set_parts.append("history = list_append(if_not_exists(history, :emptyList), :historyEntry)")

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


def save_connection(connection_id: str, user: str, role: str) -> None:
    table = _connections_table()
    table.put_item(
        Item={
            "connectionId": connection_id,
            "user": user,
            "role": role,
            "connectedAt": int(time()),
        }
    )


def delete_connection(connection_id: str) -> None:
    table = _connections_table()
    table.delete_item(Key={"connectionId": connection_id})


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
