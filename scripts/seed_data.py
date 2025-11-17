#!/usr/bin/env python3
"""
Seed script para registrar usuarios de prueba en AlertaUTEC.

Requisitos:
- Exportar API_BASE_URL, por ejemplo:
    export API_BASE_URL=https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com
- pip install requests

Uso:
    python scripts/seed_data.py
"""

import os
import sys
from datetime import datetime
from typing import Dict

import requests

BASE_URL = os.environ.get(
    "API_BASE_URL", "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com"
).rstrip("/")
VERBOSE = os.environ.get("VERBOSE", "1") == "1"


def log(message: str):
    if VERBOSE:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")


USERS = [
    # Autoridades (2)
    {"email": "andres.mendoza@utec.edu.pe", "password": "Alerta123!", "role": "autoridad", "fullName": "Andrés Mendoza"},
    {"email": "patricia.rios@utec.edu.pe", "password": "Alerta123!", "role": "autoridad", "fullName": "Patricia Ríos"},
]

USERS += [
    {"email": f"personal{i+1}@utec.edu.pe", "password": "Alerta123!", "role": "personal", "fullName": f"Personal {i+1}"}
    for i in range(8)
]

USERS += [
    {"email": f"usuario{i+1}@utec.edu.pe", "password": "Alerta123!", "role": "estudiante", "fullName": f"Usuario {i+1}"}
    for i in range(20)
]


def api_request(method: str, path: str, json_body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
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
            log(f"✓ Registrado {user['email']} ({user['role']})")
        except RuntimeError as exc:
            if "409" in str(exc):
                log(f"✓ Usuario {user['email']} ya existía, usando existente")
            else:
                log(f"✗ Error registrando {user['email']}: {exc}")
                continue

        try:
            auth = api_request("POST", "/auth/login", json_body={"email": user["email"], "password": user["password"]})
            tokens[user["email"]] = auth["token"]
        except RuntimeError as exc:
            log(f"✗ Error iniciando sesión con {user['email']}: {exc}")

    return tokens


def main():
    log("🌱 Iniciando seed de usuarios AlertaUTEC")
    log(f"API base: {BASE_URL}")

    tokens = ensure_users()
    log(f"\nUsuarios registrados o reutilizados: {len(tokens)}")
    log("Semilla completada.")


if __name__ == "__main__":
    sys.exit(main())
