import os
from functools import lru_cache
from time import time
from typing import Any, Dict, Optional

import boto3


@lru_cache(maxsize=1)
def _users_table():
    table_name = os.environ["USERS_TABLE"]
    resource = boto3.resource("dynamodb")
    return resource.Table(table_name)


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
