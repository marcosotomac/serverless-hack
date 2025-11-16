import json
import os
from typing import Any, Dict
from uuid import uuid4

import boto3

from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims

s3 = boto3.client("s3")
ALLOWED_PREFIXES = ("image/", "video/")


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        claims = get_authenticated_claims(event)
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    content_type = (payload.get("contentType") or "").strip().lower()
    file_name = (payload.get("fileName") or "").strip()
    incident_id = (payload.get("incidentId") or "").strip()

    if not content_type or not content_type.startswith(ALLOWED_PREFIXES):
        return json_response(
            400,
            {"message": "contentType debe ser image/* o video/*"},
        )

    extension = _guess_extension(content_type, file_name)
    key_parts = ["incidents"]
    key_parts.append(incident_id if incident_id else "draft")
    key = "/".join(key_parts) + f"/{uuid4()}{extension}"

    bucket = os.environ["MEDIA_BUCKET_NAME"]
    expires_in = 900
    params = {
        "Bucket": bucket,
        "Key": key,
        "ContentType": content_type,
    }
    upload_url = s3.generate_presigned_url(
        ClientMethod="put_object",
        Params=params,
        ExpiresIn=expires_in,
        HttpMethod="PUT",
    )

    return json_response(
        200,
        {
            "uploadUrl": upload_url,
            "objectKey": key,
            "bucket": bucket,
            "contentType": content_type,
            "expiresIn": expires_in,
        },
    )


def _guess_extension(content_type: str, file_name: str) -> str:
    if "." in file_name:
        return file_name[file_name.rfind(".") :]
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/x-matroska": ".mkv",
    }
    return mapping.get(content_type, "")

