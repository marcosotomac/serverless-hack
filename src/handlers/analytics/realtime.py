"""
Handler para analíticas en tiempo real desde DynamoDB
Solo accesible para rol 'autoridad'
Calcula métricas instantáneas sin depender de Athena
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from decimal import Decimal
from src.common.auth import authorize
from src.common.response import json_response
from src.common.dynamodb import list_all_incidents


@authorize(["autoridad"])
def handler(event, context):
    """
    Retorna métricas calculadas en tiempo real desde DynamoDB
    GET /analytics/realtime
    """
    try:
        # Obtener todos los incidentes
        incidents = list_all_incidents()

        # Inicializar contadores
        by_type = Counter()
        by_status = Counter()
        by_urgency = Counter()
        by_location = Counter()
        by_reporter = Counter()
        by_day = defaultdict(int)

        staff_workload = defaultdict(lambda: {
            "assigned_incidents": 0,
            "resolved": 0,
            "in_progress": 0,
            "pending": 0
        })

        significance_by_type = defaultdict(lambda: {
            "total_incidents": 0,
            "total_significance": 0,
            "max_significance": 0
        })

        # Procesar cada incidente
        for incident in incidents:
            # Por tipo
            incident_type = incident.get("type", "unknown")
            by_type[incident_type] += 1

            # Por estado
            status = incident.get("status", "unknown")
            by_status[status] += 1

            # Por urgencia
            urgency = incident.get("urgency", "unknown")
            by_urgency[urgency] += 1

            # Por ubicación
            location = incident.get("location", "unknown")
            by_location[location] += 1

            # Por reportador
            reporter = incident.get("reportedBy", "unknown")
            by_reporter[reporter] += 1

            # Por día (últimos 30 días)
            created_at = incident.get("createdAt", "")
            try:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                date_key = dt.strftime("%Y-%m-%d")
                by_day[date_key] += 1
            except:
                pass

            # Carga de trabajo del personal
            assigned_to = incident.get("assignedTo")
            if assigned_to:
                staff_workload[assigned_to]["assigned_incidents"] += 1
                if status == "resuelto":
                    staff_workload[assigned_to]["resolved"] += 1
                elif status == "en_atencion":
                    staff_workload[assigned_to]["in_progress"] += 1
                elif status == "pendiente":
                    staff_workload[assigned_to]["pending"] += 1

            # Tendencias de significancia
            sig_count = incident.get("significanceCount", 0)
            if isinstance(sig_count, Decimal):
                sig_count = int(sig_count)

            significance_by_type[incident_type]["total_incidents"] += 1
            significance_by_type[incident_type]["total_significance"] += sig_count
            if sig_count > significance_by_type[incident_type]["max_significance"]:
                significance_by_type[incident_type]["max_significance"] = sig_count

        # Formatear resultados
        results = {
            "incidents_by_type": [
                {"type": k, "count": v}
                for k, v in sorted(by_type.items(), key=lambda x: x[1], reverse=True)
            ],
            "incidents_by_status": [
                {"status": k, "count": v}
                for k, v in by_status.items()
            ],
            "incidents_by_urgency": [
                {"urgency": k, "count": v}
                for k, v in sorted(
                    by_urgency.items(),
                    key=lambda x: {"critica": 0, "alta": 1,
                                   "media": 2, "baja": 3}.get(x[0], 4)
                )
            ],
            "incidents_by_location": [
                {"location": k, "count": v}
                for k, v in sorted(by_location.items(), key=lambda x: x[1], reverse=True)[:10]
            ],
            "top_reporters": [
                {"reportedBy": k, "incidents_count": v}
                for k, v in sorted(by_reporter.items(), key=lambda x: x[1], reverse=True)[:10]
            ],
            "incidents_by_day": [
                {"date": k, "count": v}
                for k, v in sorted(by_day.items(), reverse=True)[:30]
            ],
            "staff_workload": [
                {
                    "assignedTo": k,
                    "assigned_incidents": v["assigned_incidents"],
                    "resolved": v["resolved"],
                    "in_progress": v["in_progress"],
                    "pending": v["pending"]
                }
                for k, v in sorted(
                    staff_workload.items(),
                    key=lambda x: x[1]["assigned_incidents"],
                    reverse=True
                )
            ],
            "significance_trends": [
                {
                    "type": k,
                    "total_incidents": v["total_incidents"],
                    "avg_significance": v["total_significance"] / v["total_incidents"] if v["total_incidents"] > 0 else 0,
                    "max_significance": v["max_significance"]
                }
                for k, v in sorted(
                    significance_by_type.items(),
                    key=lambda x: x[1]["total_significance"] /
                    x[1]["total_incidents"] if x[1]["total_incidents"] > 0 else 0,
                    reverse=True
                )
            ]
        }

        # Metadata
        metadata = {
            "total_incidents": len(incidents),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": "DynamoDB (real-time)",
            "latency_ms": 0  # En tiempo real
        }

        return json_response(200, {
            "results": results,
            "metadata": metadata
        })

    except Exception as e:
        return json_response(500, {
            "error": f"Error al calcular analíticas: {str(e)}"
        })
