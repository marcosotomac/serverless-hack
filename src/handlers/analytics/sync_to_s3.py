"""
Handler para sincronizar incidentes de DynamoDB a S3 para análisis con Athena
Se ejecuta cada hora automáticamente
"""
import os
import json
from datetime import datetime
from decimal import Decimal
import boto3
from src.common.dynamodb import list_all_incidents


s3_client = boto3.client("s3")


class DecimalEncoder(json.JSONEncoder):
    """Encoder personalizado para Decimal"""

    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        if isinstance(obj, set):
            return list(obj)
        return super(DecimalEncoder, self).default(obj)


def handler(event, context):
    """
    Sincroniza todos los incidentes de DynamoDB a S3 particionados por fecha
    """
    bucket_name = os.environ["ANALYTICS_DATA_BUCKET"]

    try:
        # Obtener todos los incidentes
        incidents = list_all_incidents()

        # Agrupar por fecha para particionar
        partitions = {}
        for incident in incidents:
            # Parsear fecha de creación
            created_at = incident.get("createdAt", "")
            try:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                year = dt.year
                month = dt.month
                day = dt.day
            except:
                # Si no se puede parsear, usar fecha actual
                now = datetime.utcnow()
                year = now.year
                month = now.month
                day = now.day

            # Agregar campos de partición al incidente
            incident["year"] = year
            incident["month"] = month
            incident["day"] = day

            # Crear clave de partición
            partition_key = f"{year}/{month:02d}/{day:02d}"
            if partition_key not in partitions:
                partitions[partition_key] = []

            partitions[partition_key].append(incident)

        # Subir cada partición a S3
        uploaded_count = 0
        for partition_key, partition_incidents in partitions.items():
            # Convertir a JSON Lines (cada línea es un JSON)
            json_lines = "\n".join([
                json.dumps(incident, cls=DecimalEncoder)
                for incident in partition_incidents
            ])

            # Subir a S3
            s3_key = f"incidents/year={partition_key.split('/')[0]}/month={partition_key.split('/')[1]}/day={partition_key.split('/')[2]}/data.json"

            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=json_lines.encode('utf-8'),
                ContentType='application/json'
            )

            uploaded_count += len(partition_incidents)

        print(
            f"Sincronizados {uploaded_count} incidentes en {len(partitions)} particiones")

        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Sincronización completada",
                "incidentsCount": uploaded_count,
                "partitionsCount": len(partitions)
            })
        }

    except Exception as e:
        print(f"Error en sincronización: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
