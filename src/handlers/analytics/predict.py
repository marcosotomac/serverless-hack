import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from src.common.dynamodb import list_incidents
from src.common.response import json_response
from src.common.security import AuthError, get_authenticated_claims

_runtime = boto3.client("sagemaker-runtime")


def handler(event: Dict[str, Any], _) -> Dict[str, Any]:
    try:
        get_authenticated_claims(event, allowed_roles={"personal", "autoridad"})
    except AuthError as exc:
        return json_response(401, {"message": str(exc)})

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return json_response(400, {"message": "Body must be JSON"})

    target_location = (payload.get("location") or "").strip()
    target_hour = payload.get("hour")
    target_day = payload.get("dayOfWeek")

    if target_hour is not None and not (0 <= int(target_hour) <= 23):
        return json_response(400, {"message": "hour debe estar entre 0 y 23"})

    if target_day is not None and not (0 <= int(target_day) <= 6):
        return json_response(400, {"message": "dayOfWeek debe estar entre 0 (lunes) y 6 (domingo)"})

    incidents = list_incidents()
    historical_stats = _build_historical_stats(incidents)
    features = {
        "targetLocation": target_location or None,
        "targetHour": int(target_hour) if target_hour is not None else None,
        "targetDayOfWeek": int(target_day) if target_day is not None else None,
        "historicalStats": historical_stats,
    }

    prediction = _invoke_sagemaker(features)
    if prediction is None:
        prediction = _fallback_prediction(features)

    response_body = {
        "featuresUsed": features,
        "prediction": prediction,
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
