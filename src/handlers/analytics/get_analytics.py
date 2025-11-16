"""
Handler para obtener métricas y analytics usando Athena
Solo accesible para rol 'autoridad'
"""
import os
import json
import time
import boto3
from src.common.auth import authorize
from src.common.response import json_response


athena_client = boto3.client("athena")
s3_client = boto3.client("s3")


PREDEFINED_QUERIES = {
    "incidents_by_type": """
        SELECT type, COUNT(*) as count
        FROM incidents
        GROUP BY type
        ORDER BY count DESC
    """,
    "incidents_by_status": """
        SELECT status, COUNT(*) as count
        FROM incidents
        GROUP BY status
    """,
    "incidents_by_urgency": """
        SELECT urgency, COUNT(*) as count
        FROM incidents
        GROUP BY urgency
        ORDER BY 
            CASE urgency
                WHEN 'critica' THEN 1
                WHEN 'alta' THEN 2
                WHEN 'media' THEN 3
                WHEN 'baja' THEN 4
            END
    """,
    "incidents_by_location": """
        SELECT location, COUNT(*) as count
        FROM incidents
        GROUP BY location
        ORDER BY count DESC
        LIMIT 10
    """,
    "incidents_by_day": """
        SELECT 
            CAST(year AS VARCHAR) || '-' || LPAD(CAST(month AS VARCHAR), 2, '0') || '-' || LPAD(CAST(day AS VARCHAR), 2, '0') as date,
            COUNT(*) as count
        FROM incidents
        GROUP BY year, month, day
        ORDER BY year DESC, month DESC, day DESC
        LIMIT 30
    """,
    "top_reporters": """
        SELECT reportedBy, COUNT(*) as incidents_count
        FROM incidents
        GROUP BY reportedBy
        ORDER BY incidents_count DESC
        LIMIT 10
    """,
    "staff_workload": """
        SELECT 
            assignedTo,
            COUNT(*) as assigned_incidents,
            SUM(CASE WHEN status = 'resuelto' THEN 1 ELSE 0 END) as resolved,
            SUM(CASE WHEN status = 'en_atencion' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'pendiente' THEN 1 ELSE 0 END) as pending
        FROM incidents
        WHERE assignedTo IS NOT NULL
        GROUP BY assignedTo
        ORDER BY assigned_incidents DESC
    """,
    "resolution_time": """
        SELECT 
            type,
            urgency,
            AVG(
                date_diff('second', 
                    from_iso8601_timestamp(createdAt), 
                    from_iso8601_timestamp(updatedAt)
                ) / 3600.0
            ) as avg_hours_to_update
        FROM incidents
        WHERE status = 'resuelto'
        GROUP BY type, urgency
        ORDER BY avg_hours_to_update DESC
    """,
    "significance_trends": """
        SELECT 
            type,
            AVG(significanceCount) as avg_significance,
            MAX(significanceCount) as max_significance,
            COUNT(*) as total_incidents
        FROM incidents
        GROUP BY type
        ORDER BY avg_significance DESC
    """
}


def execute_athena_query(query: str, database: str, output_location: str):
    """
    Ejecuta un query en Athena y espera el resultado
    """
    # Iniciar ejecución del query
    response = athena_client.start_query_execution(
        QueryString=query,
        QueryExecutionContext={"Database": database},
        ResultConfiguration={"OutputLocation": output_location}
    )

    query_execution_id = response["QueryExecutionId"]

    # Esperar a que termine la ejecución (máx 60 segundos)
    max_attempts = 60
    attempt = 0

    while attempt < max_attempts:
        query_status = athena_client.get_query_execution(
            QueryExecutionId=query_execution_id
        )

        status = query_status["QueryExecution"]["Status"]["State"]

        if status == "SUCCEEDED":
            # Obtener resultados
            results = athena_client.get_query_results(
                QueryExecutionId=query_execution_id
            )
            return parse_athena_results(results)

        elif status in ["FAILED", "CANCELLED"]:
            reason = query_status["QueryExecution"]["Status"].get(
                "StateChangeReason", "Unknown error"
            )
            raise Exception(f"Query failed: {reason}")

        time.sleep(1)
        attempt += 1

    raise Exception("Query execution timeout")


def parse_athena_results(results):
    """
    Parsea los resultados de Athena a formato JSON
    """
    rows = results["ResultSet"]["Rows"]

    if len(rows) == 0:
        return []

    # Primera fila contiene los headers
    headers = [col["VarCharValue"] for col in rows[0]["Data"]]

    # Resto de filas son datos
    data = []
    for row in rows[1:]:
        row_data = {}
        for i, col in enumerate(row["Data"]):
            value = col.get("VarCharValue", None)
            # Intentar convertir a número si es posible
            if value is not None:
                try:
                    value = int(value)
                except ValueError:
                    try:
                        value = float(value)
                    except ValueError:
                        pass
            row_data[headers[i]] = value
        data.append(row_data)

    return data


@authorize(["autoridad"])
def handler(event, context):
    """
    Ejecuta queries predefinidos en Athena y retorna métricas
    Query params: ?queries=incidents_by_type,incidents_by_status
    """
    database = os.environ["GLUE_DATABASE"]
    results_bucket = os.environ["ANALYTICS_RESULTS_BUCKET"]
    output_location = f"s3://{results_bucket}/query-results/"

    # Obtener queries solicitados
    query_params = event.get("queryStringParameters", {}) or {}
    requested_queries = query_params.get("queries", "").split(",")

    # Si no se especifica, ejecutar queries principales
    if not requested_queries or requested_queries == [""]:
        requested_queries = [
            "incidents_by_type",
            "incidents_by_status",
            "incidents_by_urgency",
            "incidents_by_location",
            "incidents_by_day"
        ]

    results = {}
    errors = {}

    for query_name in requested_queries:
        query_name = query_name.strip()
        if query_name not in PREDEFINED_QUERIES:
            errors[query_name] = f"Query '{query_name}' no encontrado"
            continue

        try:
            query_sql = PREDEFINED_QUERIES[query_name]
            result = execute_athena_query(query_sql, database, output_location)
            results[query_name] = result
        except Exception as e:
            errors[query_name] = str(e)

    response_data = {
        "results": results,
        "availableQueries": list(PREDEFINED_QUERIES.keys())
    }

    if errors:
        response_data["errors"] = errors

    return json_response(200, response_data)
