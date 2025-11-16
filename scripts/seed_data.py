#!/usr/bin/env python3
"""
Seed script para poblar el backend con datos realistas.

Requisitos:
- Exportar API_BASE_URL, por ejemplo:
    export API_BASE_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/dev
- `pip install requests`
"""
import os
import random
import sys
import time
from typing import Dict, List

import requests

BASE_URL = os.environ.get("API_BASE_URL", "").rstrip("/")
if not BASE_URL:
    print("API_BASE_URL es requerido (por ejemplo https://xxxx.execute-api.../dev)")
    sys.exit(1)


USERS = [
    {"email": "andres.mendoza@utec.edu.pe", "password": "Alerta123!", "role": "autoridad", "fullName": "Andrés Mendoza"},
    {"email": "camila.diaz@utec.edu.pe", "password": "Alerta123!", "role": "personal", "fullName": "Camila Díaz"},
    {"email": "carlos.mendoza@utec.edu.pe", "password": "Alerta123!", "role": "personal", "fullName": "Carlos Mendoza"},
    {"email": "valeria.lopez@utec.edu.pe", "password": "Alerta123!", "role": "estudiante", "fullName": "Valeria López"},
    {"email": "sebastian.ramos@utec.edu.pe", "password": "Alerta123!", "role": "estudiante", "fullName": "Sebastián Ramos"},
    {"email": "maria.torres@utec.edu.pe", "password": "Alerta123!", "role": "estudiante", "fullName": "María Torres"},
]

INCIDENTS = [
    {
        "reportedBy": "valeria.lopez@utec.edu.pe",
        "type": "Fuga de agua",
        "location": "Laboratorio de Química - Pabellón C",
        "description": "Se rompió una tubería y el agua llega al pasillo, el piso está resbaloso.",
        "urgency": "alta",
        "note": "Los equipos cercanos están apagados, pero necesitamos apoyo.",
        "assignedTo": "camila.diaz@utec.edu.pe",
        "comments": [
            {"by": "valeria.lopez@utec.edu.pe", "text": "Actualización: la fuga aumenta, necesitamos cerrar las válvulas."}
        ],
        "significanceVoters": ["sebastian.ramos@utec.edu.pe", "maria.torres@utec.edu.pe"],
        "statusFlow": [
            {"by": "camila.diaz@utec.edu.pe", "status": "en_atencion", "note": "Equipo en camino a cerrar válvula principal."},
            {"by": "camila.diaz@utec.edu.pe", "status": "resuelto", "note": "Válvula reemplazada y zona asegurada."},
        ],
    },
    {
        "reportedBy": "sebastian.ramos@utec.edu.pe",
        "type": "Corte eléctrico",
        "location": "Pabellón B - Aulas 201-205",
        "description": "Las luces y proyectores no encienden, y hay olor a quemado.",
        "urgency": "critica",
        "note": "Ocurrió durante laboratorio de electrónica.",
        "assignedTo": "carlos.mendoza@utec.edu.pe",
        "comments": [
            {"by": "sebastian.ramos@utec.edu.pe", "text": "Los estudiantes fueron evacuados, pero necesitamos revisión urgente."}
        ],
        "significanceVoters": ["valeria.lopez@utec.edu.pe", "maria.torres@utec.edu.pe"],
        "statusFlow": [
            {"by": "carlos.mendoza@utec.edu.pe", "status": "en_atencion", "note": "Revisión de tableros eléctricos en progreso."}
        ],
    },
    {
        "reportedBy": "maria.torres@utec.edu.pe",
        "type": "Seguridad",
        "location": "Entrada principal",
        "description": "Se observó a una persona saltando la reja durante la noche.",
        "urgency": "media",
        "note": "Hay cámaras en la zona.",
        "assignedTo": None,
        "comments": [
            {"by": "maria.torres@utec.edu.pe", "text": "Guardia informó que no encontró al intruso, pero dejó registro."}
        ],
        "significanceVoters": ["valeria.lopez@utec.edu.pe"],
        "statusFlow": [],
    },
]


def api_request(method: str, path: str, token: str = None, json_body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    response = requests.request(method, url, headers=headers, json=json_body, timeout=30)
    if response.status_code >= 400:
        raise RuntimeError(f"{method} {path} failed {response.status_code}: {response.text}")
    if response.text:
        return response.json()
    return {}


def ensure_users() -> Dict[str, str]:
    tokens = {}
    for user in USERS:
        try:
            api_request("POST", "/auth/register", json_body=user)
            print(f"Registrado {user['email']}")
        except RuntimeError as exc:
            if "409" not in str(exc):
                raise
            print(f"Usuario {user['email']} ya existe, usando existente.")

        data = api_request("POST", "/auth/login", json_body={"email": user["email"], "password": user["password"]})
        tokens[user["email"]] = data["token"]
    return tokens


def create_incidents(tokens: Dict[str, str]) -> List[str]:
    created_ids = []
    for incident in INCIDENTS:
        payload = {
            "type": incident["type"],
            "location": incident["location"],
            "description": incident["description"],
            "urgency": incident["urgency"],
            "note": incident.get("note", ""),
            "mediaKeys": [],
        }
        result = api_request("POST", "/incidents", token=tokens[incident["reportedBy"]], json_body=payload)
        incident_id = result["incident"]["incidentId"]
        created_ids.append(incident_id)
        print(f"Incidente creado: {incident_id} ({incident['type']})")

        if incident.get("assignedTo"):
            api_request(
                "PATCH",
                f"/incidents/{incident_id}/assign",
                token=tokens["andres.mendoza@utec.edu.pe"],
                json_body={"assignedTo": incident["assignedTo"]},
            )

        for flow in incident.get("statusFlow", []):
            api_request(
                "PATCH",
                f"/incidents/{incident_id}",
                token=tokens[flow["by"]],
                json_body={"status": flow["status"], "note": flow["note"]},
            )

        for comment in incident.get("comments", []):
            api_request(
                "POST",
                f"/incidents/{incident_id}/comments",
                token=tokens[comment["by"]],
                json_body={"text": comment["text"]},
            )

        for voter in incident.get("significanceVoters", []):
            try:
                api_request(
                    "POST",
                    f"/incidents/{incident_id}/significance",
                    token=tokens[voter],
                    json_body={},
                )
            except RuntimeError as exc:
                print(f"Significance para {incident_id} por {voter} omitido: {exc}")

        time.sleep(0.5)
    return created_ids


def main():
    print(f"Sembrando datos en {BASE_URL}")
    tokens = ensure_users()
    incident_ids = create_incidents(tokens)
    print(f"Seed completado. Incidentes creados: {incident_ids}")


if __name__ == "__main__":
    main()
