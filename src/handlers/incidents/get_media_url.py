import json
import os
from typing import Any, Dict

import boto3

from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims

s3 = boto3.client("s3")


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    """
    Genera URLs firmadas de lectura para archivos multimedia.
    GET /incidents/media/{objectKey}
    """
    try:
        claims = get_authenticated_claims(event)
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    # Obtener objectKey de los path parameters
    path_params = event.get("pathParameters") or {}
    object_key = path_params.get("objectKey", "").strip()

    if not object_key:
        return json_response(400, {"message": "objectKey es requerido"})

    bucket = os.environ["MEDIA_BUCKET_NAME"]
    expires_in = 3600  # 1 hora

    try:
        # Verificar que el objeto existe
        s3.head_object(Bucket=bucket, Key=object_key)

        # Generar URL firmada
        url = s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={
                "Bucket": bucket,
                "Key": object_key,
            },
            ExpiresIn=expires_in,
            HttpMethod="GET",
        )

        return json_response(
            200,
            {
                "url": url,
                "objectKey": object_key,
                "expiresIn": expires_in,
            },
        )
    except s3.exceptions.NoSuchKey:
        return json_response(404, {"message": "Archivo no encontrado"})
    except Exception as exc:
        return json_response(500, {"message": f"Error al generar URL: {str(exc)}"})
