import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from src.common.dynamodb import list_incidents
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims

_runtime = boto3.client("sagemaker-runtime")


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        claims = get_authenticated_claims(event, allowed_roles={"autoridad"})
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    analysis_type = payload.get("analysisType", "comprehensive")  # comprehensive, zones, times, trends
    days_back = int(payload.get("daysBack", 90))
    target_location = (payload.get("location") or "").strip()
    target_hour = payload.get("hour")
    target_day = payload.get("dayOfWeek")

    if target_hour is not None and not (0 <= int(target_hour) <= 23):
        return json_response(400, {"message": "hour debe estar entre 0 y 23"})

    if target_day is not None and not (0 <= int(target_day) <= 6):
        return json_response(400, {"message": "dayOfWeek debe estar entre 0 (lunes) y 6 (domingo)"})

    # Obtener incidentes y filtrar por rango de fechas
    all_incidents = list_incidents()
    cutoff_timestamp = int((datetime.now() - timedelta(days=days_back)).timestamp())
    incidents = [
        inc for inc in all_incidents
        if int(inc.get("createdAt", 0)) >= cutoff_timestamp
    ]

    # Construir estadísticas históricas
    historical_stats = _build_historical_stats(incidents)
    
    # Análisis de zonas de riesgo
    risk_zones = _analyze_risk_zones(incidents) if analysis_type in ["comprehensive", "zones"] else []
    
    # Análisis de horarios críticos
    critical_times = _analyze_critical_times(incidents) if analysis_type in ["comprehensive", "times"] else {}
    
    # Análisis de tendencias de recurrencia
    recurrence_trends = _analyze_recurrence(incidents) if analysis_type in ["comprehensive", "trends"] else {}
    
    # Predicciones por ubicación
    location_predictions = _predict_by_location(incidents) if analysis_type in ["comprehensive", "zones"] else []
    
    # Generar recomendaciones
    recommendations = _generate_recommendations(risk_zones, critical_times, incidents)

    features = {
        "targetLocation": target_location or None,
        "targetHour": int(target_hour) if target_hour is not None else None,
        "targetDayOfWeek": int(target_day) if target_day is not None else None,
        "historicalStats": historical_stats,
    }

    # Intentar usar SageMaker si está configurado
    ml_prediction = _invoke_sagemaker(features)
    if ml_prediction is None:
        ml_prediction = _fallback_prediction(features)

    response_body = {
        "metadata": {
            "analyzed_incidents": len(incidents),
            "time_range_days": days_back,
            "generated_at": datetime.now().isoformat(),
            "ml_model_used": bool(os.environ.get("SAGEMAKER_ENDPOINT_NAME")),
            "analysis_type": analysis_type
        },
        "predictions": ml_prediction,
        "risk_zones": risk_zones,
        "critical_times": critical_times,
        "recurrence_trends": recurrence_trends,
        "location_predictions": location_predictions,
        "recommendations": recommendations,
        "insights": {
            "topIncidentTypes": historical_stats["countsByType"][:5],
            "topRiskZones": historical_stats["countsByLocation"][:5],
            "peakHours": historical_stats["countsByHour"][:5],
        },
    }
    return json_response(200, response_body)


def _build_historical_stats(incidents: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    type_counter = Counter()
    location_counter = Counter()
    hour_counter = Counter()
    day_counter = Counter()
    location_type_counter = defaultdict(Counter)

    for incident in incidents:
        incident_type = incident.get("type", "desconocido")
        location = incident.get("location", "sin_ubicacion")
        timestamp = incident.get("createdAt") or incident.get("updatedAt")
        if timestamp:
            dt = datetime.fromtimestamp(int(timestamp), tz=timezone.utc)
            hour_counter[dt.hour] += 1
            day_counter[dt.weekday()] += 1
        type_counter[incident_type] += 1
        location_counter[location] += 1
        location_type_counter[location][incident_type] += 1

    def _format_counter(counter: Counter, key_name: str) -> List[Dict[str, Any]]:
        return [{key_name: key, "count": count} for key, count in counter.most_common()]

    return {
        "countsByType": _format_counter(type_counter, "type"),
        "countsByLocation": _format_counter(location_counter, "location"),
        "countsByHour": [{ "hour": hour, "count": count } for hour, count in hour_counter.most_common()],
        "countsByDayOfWeek": [{ "day": day, "count": count } for day, count in day_counter.most_common()],
        "countsByLocationAndType": [
            {"location": location, "topTypes": _format_counter(counter, "type")}
            for location, counter in location_type_counter.items()
        ],
    }


def _invoke_sagemaker(payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    endpoint = os.environ.get("SAGEMAKER_ENDPOINT_NAME")
    if not endpoint:
        return None
    try:
        response = _runtime.invoke_endpoint(
            EndpointName=endpoint,
            ContentType="application/json",
            Body=json.dumps(payload).encode("utf-8"),
        )
        raw = response["Body"].read()
        text = raw.decode("utf-8")
        return json.loads(text)
    except (BotoCoreError, ClientError, ValueError, json.JSONDecodeError):
        return None


def _fallback_prediction(features: Dict[str, Any]) -> Dict[str, Any]:
    stats = features["historicalStats"]
    top_types = stats["countsByType"][:3]
    total = sum(item["count"] for item in top_types) or 1
    probable = [
        {
            "type": item["type"],
            "probability": round(item["count"] / total, 2),
        }
        for item in top_types
    ]
    hotspots = [
        {
            "location": item["location"],
            "intensity": item["count"],
        }
        for item in stats["countsByLocation"][:3]
    ]
    recommended_focus = features.get("targetLocation") or (
        hotspots[0]["location"] if hotspots else None
    )
    return {
        "probableIncidents": probable,
        "hotspots": hotspots,
        "recommendedFocus": recommended_focus,
        "source": "heuristic",
    }


def _analyze_risk_zones(incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Identifica zonas de alto riesgo basándose en frecuencia y severidad"""
    location_stats = defaultdict(lambda: {
        "incident_count": 0,
        "high_urgency_count": 0,
        "high_priority_count": 0,
        "unresolved_count": 0,
        "incident_types": Counter()
    })
    
    for incident in incidents:
        location = incident.get("location", "Desconocido")
        urgency = incident.get("urgency", "baja")
        priority = incident.get("priority", "baja")
        status = incident.get("status", "pendiente")
        inc_type = incident.get("type", "otro")
        
        location_stats[location]["incident_count"] += 1
        location_stats[location]["incident_types"][inc_type] += 1
        
        if urgency == "alta":
            location_stats[location]["high_urgency_count"] += 1
        if priority == "alta":
            location_stats[location]["high_priority_count"] += 1
        if status != "resuelto":
            location_stats[location]["unresolved_count"] += 1
    
    risk_zones = []
    for location, stats in location_stats.items():
        risk_score = (
            stats["incident_count"] * 1.0 +
            stats["high_urgency_count"] * 2.0 +
            stats["high_priority_count"] * 1.5 +
            stats["unresolved_count"] * 1.2
        )
        max_score = max(1, len(incidents) * 2)
        normalized_score = min(100, (risk_score / max_score) * 100)
        
        risk_level = "critical" if normalized_score >= 70 else \
                     "high" if normalized_score >= 50 else \
                     "medium" if normalized_score >= 30 else "low"
        
        most_common_type = stats["incident_types"].most_common(1)[0] if stats["incident_types"] else ("otro", 0)
        
        risk_zones.append({
            "location": location,
            "risk_score": round(normalized_score, 2),
            "risk_level": risk_level,
            "total_incidents": stats["incident_count"],
            "high_urgency_incidents": stats["high_urgency_count"],
            "high_priority_incidents": stats["high_priority_count"],
            "unresolved_incidents": stats["unresolved_count"],
            "most_common_incident": most_common_type[0],
            "prediction": f"Se esperan ~{round(stats['incident_count'] / 3)} incidentes en los próximos 30 días"
        })
    
    risk_zones.sort(key=lambda x: x["risk_score"], reverse=True)
    return risk_zones[:10]


def _analyze_critical_times(incidents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Identifica horarios críticos para incidentes"""
    hour_stats = defaultdict(lambda: {"count": 0, "types": Counter()})
    day_stats = defaultdict(lambda: {"count": 0, "types": Counter()})
    
    for incident in incidents:
        timestamp = incident.get("createdAt")
        inc_type = incident.get("type", "otro")
        
        if timestamp:
            try:
                dt = datetime.fromtimestamp(int(timestamp), tz=timezone.utc)
                hour = dt.hour
                day = dt.strftime("%A")
                
                hour_stats[hour]["count"] += 1
                hour_stats[hour]["types"][inc_type] += 1
                day_stats[day]["count"] += 1
                day_stats[day]["types"][inc_type] += 1
            except:
                continue
    
    peak_hours = []
    for hour, stats in sorted(hour_stats.items(), key=lambda x: x[1]["count"], reverse=True)[:5]:
        most_common = stats["types"].most_common(1)[0] if stats["types"] else ("otro", 0)
        peak_hours.append({
            "hour": f"{hour:02d}:00 - {hour:02d}:59",
            "incident_count": stats["count"],
            "most_common_type": most_common[0],
            "risk_level": "high" if stats["count"] > len(incidents) / 24 * 1.5 else "medium"
        })
    
    critical_days = []
    for day, stats in sorted(day_stats.items(), key=lambda x: x[1]["count"], reverse=True):
        most_common = stats["types"].most_common(1)[0] if stats["types"] else ("otro", 0)
        critical_days.append({
            "day": day,
            "incident_count": stats["count"],
            "most_common_type": most_common[0]
        })
    
    return {
        "peak_hours": peak_hours,
        "critical_days": critical_days,
        "recommendation": "Aumentar vigilancia durante horas pico identificadas"
    }


def _analyze_recurrence(incidents: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analiza tendencias de recurrencia de incidentes"""
    weekly_stats = defaultdict(lambda: {"count": 0, "types": Counter()})
    
    for incident in incidents:
        timestamp = incident.get("createdAt")
        inc_type = incident.get("type", "otro")
        
        if timestamp:
            try:
                dt = datetime.fromtimestamp(int(timestamp), tz=timezone.utc)
                week = dt.strftime("%Y-W%W")
                weekly_stats[week]["count"] += 1
                weekly_stats[week]["types"][inc_type] += 1
            except:
                continue
    
    weeks = sorted(weekly_stats.keys())
    if len(weeks) >= 2:
        recent_avg = sum(weekly_stats[w]["count"] for w in weeks[-4:]) / min(4, len(weeks[-4:]))
        older_avg = sum(weekly_stats[w]["count"] for w in weeks[:4]) / min(4, len(weeks[:4]))
        
        trend = "increasing" if recent_avg > older_avg * 1.1 else \
                "decreasing" if recent_avg < older_avg * 0.9 else "stable"
        trend_percentage = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
    else:
        trend = "insufficient_data"
        trend_percentage = 0
        recent_avg = 0
    
    all_types = Counter()
    for stats in weekly_stats.values():
        all_types.update(stats["types"])
    
    return {
        "overall_trend": trend,
        "trend_percentage": round(trend_percentage, 2),
        "avg_incidents_per_week": round(recent_avg, 2),
        "most_recurrent_types": [
            {"type": t, "count": c} 
            for t, c in all_types.most_common(5)
        ],
        "prediction": f"Tendencia {trend} - Se espera un promedio de {round(recent_avg)} incidentes por semana"
    }


def _predict_by_location(incidents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Predice tipos de incidentes más probables por ubicación"""
    location_type_map = defaultdict(lambda: Counter())
    
    for incident in incidents:
        location = incident.get("location", "Desconocido")
        inc_type = incident.get("type", "otro")
        location_type_map[location][inc_type] += 1
    
    predictions = []
    for location, type_counts in location_type_map.items():
        total = sum(type_counts.values())
        type_predictions = []
        
        for inc_type, count in type_counts.most_common(3):
            probability = (count / total) * 100
            type_predictions.append({
                "type": inc_type,
                "probability": round(probability, 2),
                "historical_count": count
            })
        
        predictions.append({
            "location": location,
            "predicted_types": type_predictions,
            "total_historical": total
        })
    
    return predictions


def _generate_recommendations(risk_zones: List[Dict], critical_times: Dict, incidents: List[Dict]) -> List[Dict[str, str]]:
    """Genera recomendaciones basadas en análisis"""
    recommendations = []
    
    if risk_zones and len(risk_zones) > 0:
        top_zone = risk_zones[0]
        recommendations.append({
            "priority": "high",
            "category": "risk_zone",
            "title": f"Zona de Alto Riesgo: {top_zone['location']}",
            "description": f"Esta zona ha registrado {top_zone['total_incidents']} incidentes. Se recomienda aumentar vigilancia y mantenimiento preventivo.",
            "action": "Asignar personal adicional a esta zona"
        })
    
    if critical_times and critical_times.get("peak_hours"):
        peak = critical_times["peak_hours"][0]
        recommendations.append({
            "priority": "medium",
            "category": "critical_time",
            "title": f"Horario Crítico: {peak['hour']}",
            "description": f"Mayor incidencia de {peak['most_common_type']} durante este horario.",
            "action": "Programar rondas preventivas en este horario"
        })
    
    type_counts = Counter(inc.get("type") for inc in incidents)
    if type_counts:
        most_common = type_counts.most_common(1)[0]
        if most_common[0] in ["infraestructura", "mantenimiento"] and most_common[1] > 5:
            recommendations.append({
                "priority": "medium",
                "category": "preventive",
                "title": "Mantenimiento Preventivo Recomendado",
                "description": f"Alta recurrencia de problemas de {most_common[0]} ({most_common[1]} casos).",
                "action": "Implementar programa de mantenimiento preventivo trimestral"
            })
    
    return recommendations

