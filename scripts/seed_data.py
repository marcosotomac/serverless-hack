#!/usr/bin/env python3
"""
Seed script para poblar el backend con datos realistas de AlertaUTEC.

Requisitos:
- Exportar API_BASE_URL, por ejemplo:
    export API_BASE_URL=https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com
- `pip install requests`

Uso:
    python scripts/seed_data.py
    
O con URL custom:
    API_BASE_URL=https://tu-api.com python scripts/seed_data.py
"""
import os
import random
import sys
import time
from typing import Dict, List
from datetime import datetime

import requests

# Configuración
BASE_URL = os.environ.get(
    "API_BASE_URL", "https://2dutzw4lw9.execute-api.us-east-1.amazonaws.com").rstrip("/")
VERBOSE = os.environ.get("VERBOSE", "1") == "1"


def log(msg: str):
    """Log solo si VERBOSE está activado"""
    if VERBOSE:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")

# ============================================================================
# DATOS DE SEED
# ============================================================================


# Usuarios del sistema (3 autoridades, 5 personal, 10 estudiantes)
USERS = [
    # Autoridades
    {"email": "andres.mendoza@utec.edu.pe", "password": "Alerta123!",
        "role": "autoridad", "fullName": "Andrés Mendoza"},
    {"email": "patricia.rios@utec.edu.pe", "password": "Alerta123!",
        "role": "autoridad", "fullName": "Patricia Ríos"},
    {"email": "roberto.garcia@utec.edu.pe", "password": "Alerta123!",
        "role": "autoridad", "fullName": "Roberto García"},

    # Personal de mantenimiento y seguridad
    {"email": "camila.diaz@utec.edu.pe", "password": "Alerta123!",
        "role": "personal", "fullName": "Camila Díaz"},
    {"email": "carlos.mendoza@utec.edu.pe", "password": "Alerta123!",
        "role": "personal", "fullName": "Carlos Mendoza"},
    {"email": "luis.ramirez@utec.edu.pe", "password": "Alerta123!",
        "role": "personal", "fullName": "Luis Ramírez"},
    {"email": "sofia.castro@utec.edu.pe", "password": "Alerta123!",
        "role": "personal", "fullName": "Sofía Castro"},
    {"email": "diego.vargas@utec.edu.pe", "password": "Alerta123!",
        "role": "personal", "fullName": "Diego Vargas"},

    # Estudiantes
    {"email": "valeria.lopez@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "Valeria López"},
    {"email": "sebastian.ramos@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "Sebastián Ramos"},
    {"email": "maria.torres@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "María Torres"},
    {"email": "jose.paredes@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "José Paredes"},
    {"email": "ana.flores@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "Ana Flores"},
    {"email": "miguel.santos@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "Miguel Santos"},
    {"email": "lucia.ortiz@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "Lucía Ortiz"},
    {"email": "pablo.herrera@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "Pablo Herrera"},
    {"email": "isabella.roman@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "Isabella Román"},
    {"email": "david.cruz@utec.edu.pe", "password": "Alerta123!",
        "role": "estudiante", "fullName": "David Cruz"},
]

# Incidentes con diferentes estados, tipos y niveles de urgencia
INCIDENTS = [
    # INCIDENTES RESUELTOS
    {
        "reportedBy": "valeria.lopez@utec.edu.pe",
        "type": "Fuga de agua",
        "location": "Laboratorio de Química - Pabellón C",
        "description": "Se rompió una tubería y el agua llega al pasillo, el piso está resbaloso y puede causar accidentes.",
        "urgency": "alta",
        "note": "Los equipos cercanos están apagados por seguridad.",
        "assignedTo": "camila.diaz@utec.edu.pe",
        "comments": [
            {"by": "valeria.lopez@utec.edu.pe",
                "text": "Actualización: la fuga aumenta, necesitamos cerrar las válvulas principales."},
            {"by": "camila.diaz@utec.edu.pe",
                "text": "Equipo en camino, estimamos 20 minutos."},
        ],
        "significanceVoters": ["sebastian.ramos@utec.edu.pe", "maria.torres@utec.edu.pe", "jose.paredes@utec.edu.pe"],
        "statusFlow": [
            {"by": "camila.diaz@utec.edu.pe", "status": "en_atencion",
                "note": "Equipo llegó y cerró válvula principal."},
            {"by": "camila.diaz@utec.edu.pe", "status": "resuelto",
                "note": "Tubería reparada, zona limpia y seca. Verificado."},
        ],
        "priority": "alta",
    },
    {
        "reportedBy": "sebastian.ramos@utec.edu.pe",
        "type": "Corte eléctrico",
        "location": "Pabellón B - Aulas 201-205",
        "description": "Las luces y proyectores no encienden. Hay olor a quemado en el pasillo.",
        "urgency": "critica",
        "note": "Ocurrió durante el laboratorio de electrónica, evacuamos a los estudiantes.",
        "assignedTo": "carlos.mendoza@utec.edu.pe",
        "comments": [
            {"by": "sebastian.ramos@utec.edu.pe",
                "text": "Confirmado: tablero eléctrico con humo."},
            {"by": "carlos.mendoza@utec.edu.pe",
                "text": "Desconectando circuito afectado, revisando origen."},
        ],
        "significanceVoters": ["valeria.lopez@utec.edu.pe", "maria.torres@utec.edu.pe", "ana.flores@utec.edu.pe", "miguel.santos@utec.edu.pe"],
        "statusFlow": [
            {"by": "carlos.mendoza@utec.edu.pe", "status": "en_atencion",
                "note": "Revisión de tableros en curso."},
            {"by": "carlos.mendoza@utec.edu.pe", "status": "resuelto",
                "note": "Cortocircuito reparado, sistema restaurado."},
        ],
        "priority": "critica",
    },
    {
        "reportedBy": "maria.torres@utec.edu.pe",
        "type": "Limpieza",
        "location": "Cafetería - Piso 1",
        "description": "Derrame de líquido en el piso, muy resbaloso y peligroso.",
        "urgency": "media",
        "note": "Hay señalización provisional pero necesita limpieza urgente.",
        "assignedTo": "luis.ramirez@utec.edu.pe",
        "comments": [],
        "significanceVoters": ["jose.paredes@utec.edu.pe"],
        "statusFlow": [
            {"by": "luis.ramirez@utec.edu.pe", "status": "en_atencion",
                "note": "Iniciando limpieza profunda."},
            {"by": "luis.ramirez@utec.edu.pe", "status": "resuelto",
                "note": "Zona limpia y seca, señales retiradas."},
        ],
        "priority": "media",
    },

    # INCIDENTES EN ATENCIÓN
    {
        "reportedBy": "jose.paredes@utec.edu.pe",
        "type": "Fuga de agua",
        "location": "Baño de estudiantes - Piso 3, Pabellón A",
        "description": "El inodoro del segundo cubículo no deja de fluir agua, está desbordándose.",
        "urgency": "alta",
        "note": "Urgente, el agua está saliendo al pasillo.",
        "assignedTo": "sofia.castro@utec.edu.pe",
        "comments": [
            {"by": "jose.paredes@utec.edu.pe",
                "text": "El agua sigue aumentando, ¿cuándo llega el equipo?"},
            {"by": "sofia.castro@utec.edu.pe", "text": "En camino, 10 minutos."},
        ],
        "significanceVoters": ["ana.flores@utec.edu.pe", "lucia.ortiz@utec.edu.pe"],
        "statusFlow": [
            {"by": "sofia.castro@utec.edu.pe", "status": "en_atencion",
                "note": "Cerrando llave de paso y verificando daños."},
        ],
        "priority": "alta",
    },
    {
        "reportedBy": "ana.flores@utec.edu.pe",
        "type": "Daño estructural",
        "location": "Escalera principal - Pabellón D",
        "description": "Escalón roto en el tercer nivel, se puede tropezar fácilmente.",
        "urgency": "media",
        "note": "Hay cinta de señalización pero necesita reparación.",
        "assignedTo": "diego.vargas@utec.edu.pe",
        "comments": [
            {"by": "miguel.santos@utec.edu.pe",
                "text": "Confirmo, casi me caigo esta mañana."},
        ],
        "significanceVoters": ["miguel.santos@utec.edu.pe", "pablo.herrera@utec.edu.pe"],
        "statusFlow": [
            {"by": "diego.vargas@utec.edu.pe", "status": "en_atencion",
                "note": "Evaluando reparación, necesitamos materiales."},
        ],
        "priority": "media",
    },
    {
        "reportedBy": "miguel.santos@utec.edu.pe",
        "type": "Iluminación",
        "location": "Estacionamiento - Zona B",
        "description": "Varios reflectores están apagados, la zona está muy oscura por las noches.",
        "urgency": "media",
        "note": "Puede ser peligroso para la seguridad.",
        "assignedTo": "carlos.mendoza@utec.edu.pe",
        "comments": [],
        "significanceVoters": ["lucia.ortiz@utec.edu.pe", "david.cruz@utec.edu.pe"],
        "statusFlow": [
            {"by": "carlos.mendoza@utec.edu.pe", "status": "en_atencion",
                "note": "Reemplazando focos, mitad completada."},
        ],
        "priority": "media",
    },

    # INCIDENTES PENDIENTES (sin asignar)
    {
        "reportedBy": "lucia.ortiz@utec.edu.pe",
        "type": "Seguridad",
        "location": "Entrada principal",
        "description": "Se observó a una persona saltando la reja durante la noche (aprox. 11:30 PM).",
        "urgency": "alta",
        "note": "Hay cámaras en la zona, se debería revisar las grabaciones.",
        "assignedTo": None,
        "comments": [
            {"by": "lucia.ortiz@utec.edu.pe",
                "text": "El guardia me confirmó que revisará las cámaras."},
            {"by": "david.cruz@utec.edu.pe",
                "text": "Yo también lo vi desde la biblioteca."},
        ],
        "significanceVoters": ["valeria.lopez@utec.edu.pe", "david.cruz@utec.edu.pe", "pablo.herrera@utec.edu.pe"],
        "statusFlow": [],
        "priority": None,
    },
    {
        "reportedBy": "pablo.herrera@utec.edu.pe",
        "type": "Aire acondicionado",
        "location": "Sala de cómputo - Piso 2",
        "description": "El aire acondicionado hace ruido muy fuerte y no enfría adecuadamente.",
        "urgency": "baja",
        "note": "Hace calor pero aún es tolerable.",
        "assignedTo": None,
        "comments": [],
        "significanceVoters": ["isabella.roman@utec.edu.pe"],
        "statusFlow": [],
        "priority": None,
    },
    {
        "reportedBy": "isabella.roman@utec.edu.pe",
        "type": "Limpieza",
        "location": "Biblioteca - Segundo piso",
        "description": "Los botes de basura están llenos y hay mal olor.",
        "urgency": "baja",
        "note": "Sería bueno que se vacíen más seguido.",
        "assignedTo": None,
        "comments": [],
        "significanceVoters": [],
        "statusFlow": [],
        "priority": None,
    },
    {
        "reportedBy": "david.cruz@utec.edu.pe",
        "type": "Conectividad",
        "location": "Aula 305 - Pabellón C",
        "description": "El WiFi no funciona, imposible conectarse durante las clases.",
        "urgency": "media",
        "note": "Afecta a todos los estudiantes del aula.",
        "assignedTo": None,
        "comments": [
            {"by": "ana.flores@utec.edu.pe",
                "text": "Confirmo, tuve que usar mis datos móviles."},
        ],
        "significanceVoters": ["ana.flores@utec.edu.pe", "jose.paredes@utec.edu.pe"],
        "statusFlow": [],
        "priority": None,
    },
    {
        "reportedBy": "valeria.lopez@utec.edu.pe",
        "type": "Daño estructural",
        "location": "Ventana del aula 201",
        "description": "Vidrio con grieta grande, puede romperse en cualquier momento.",
        "urgency": "alta",
        "note": "Peligro para los estudiantes que se sientan cerca.",
        "assignedTo": None,
        "comments": [],
        "significanceVoters": ["sebastian.ramos@utec.edu.pe", "maria.torres@utec.edu.pe"],
        "statusFlow": [],
        "priority": None,
    },
]


# ============================================================================
# FUNCIONES DE API
# ============================================================================

def api_request(method: str, path: str, token: str = None, json_body=None, retry=3):
    """
    Realiza una petición HTTP al API con retry automático.

    Args:
        method: GET, POST, PATCH, DELETE
        path: Ruta del endpoint (ej: /incidents)
        token: JWT token opcional
        json_body: Body JSON opcional
        retry: Número de reintentos en caso de error

    Returns:
        Response JSON parseado

    Raises:
        RuntimeError: Si la petición falla después de todos los reintentos
    """
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    for attempt in range(retry):
        try:
            response = requests.request(
                method, url, headers=headers, json=json_body, timeout=30)

            # Manejar respuestas exitosas
            if response.status_code < 400:
                if response.text:
                    return response.json()
                return {}

            # Manejar errores específicos
            if response.status_code == 409:
                # Conflicto - el recurso ya existe (aceptable para registro)
                if "register" in path or "Usuario ya existe" in response.text:
                    return {"message": "Already exists"}

            # Si no es recuperable, lanzar error
            if response.status_code >= 400:
                error_msg = f"{method} {path} failed {response.status_code}: {response.text}"
                if attempt < retry - 1:
                    log(f"⚠️  {error_msg} (reintentando {attempt + 1}/{retry}...)")
                    time.sleep(1)
                    continue
                else:
                    raise RuntimeError(error_msg)

        except requests.exceptions.RequestException as e:
            if attempt < retry - 1:
                log(f"⚠️  Error de conexión: {e} (reintentando {attempt + 1}/{retry}...)")
                time.sleep(2)
                continue
            else:
                raise RuntimeError(
                    f"Error de conexión después de {retry} intentos: {e}")

    return {}


def ensure_users() -> Dict[str, str]:
    """
    Registra todos los usuarios y obtiene sus tokens.
    Si un usuario ya existe, solo hace login.

    Returns:
        Dict con email -> token JWT
    """
    log(f"\n{'='*60}")
    log("PASO 1: Registrando usuarios...")
    log(f"{'='*60}")

    tokens = {}
    registered = 0
    existing = 0

    for user in USERS:
        try:
            result = api_request("POST", "/auth/register", json_body=user)
            if result.get("message") == "Already exists":
                log(f"✓ Usuario {user['email']} ({user['role']}) - ya existe")
                existing += 1
            else:
                log(f"✓ Registrado {user['email']} ({user['role']}) - NUEVO")
                registered += 1
        except RuntimeError as exc:
            if "409" in str(exc) or "ya existe" in str(exc).lower():
                log(f"✓ Usuario {user['email']} ({user['role']}) - ya existe")
                existing += 1
            else:
                log(f"✗ Error registrando {user['email']}: {exc}")
                continue

        # Login para obtener token
        try:
            data = api_request(
                "POST",
                "/auth/login",
                json_body={"email": user["email"],
                           "password": user["password"]}
            )
            tokens[user["email"]] = data["token"]
        except Exception as e:
            log(f"✗ Error en login de {user['email']}: {e}")
            continue

    log(f"\n📊 Resumen usuarios: {registered} nuevos, {existing} existentes, {len(tokens)} tokens obtenidos")
    return tokens


def create_incidents(tokens: Dict[str, str]) -> List[str]:
    """
    Crea todos los incidentes con sus comentarios, asignaciones, etc.

    Args:
        tokens: Dict con email -> token JWT

    Returns:
        Lista de IDs de incidentes creados
    """
    log(f"\n{'='*60}")
    log("PASO 2: Creando incidentes...")
    log(f"{'='*60}")

    created_ids = []
    autoridad_token = tokens.get("andres.mendoza@utec.edu.pe")

    for idx, incident in enumerate(INCIDENTS, 1):
        reporter_email = incident["reportedBy"]

        if reporter_email not in tokens:
            log(f"✗ Incidente {idx}: Reporter {reporter_email} no tiene token, omitiendo...")
            continue

        # 1. Crear incidente
        payload = {
            "type": incident["type"],
            "location": incident["location"],
            "description": incident["description"],
            "urgency": incident["urgency"],
            "note": incident.get("note", ""),
            "mediaKeys": [],
        }

        try:
            result = api_request(
                "POST", "/incidents", token=tokens[reporter_email], json_body=payload)
            incident_id = result["incident"]["incidentId"]
            created_ids.append(incident_id)
            log(
                f"✓ Incidente {idx}/{len(INCIDENTS)}: {incident_id} - {incident['type']} ({incident['location']})")
        except Exception as e:
            log(f"✗ Error creando incidente {idx}: {e}")
            continue

        # 2. Asignar a personal (si corresponde)
        if incident.get("assignedTo") and autoridad_token:
            try:
                api_request(
                    "PATCH",
                    f"/incidents/{incident_id}/assign",
                    token=autoridad_token,
                    json_body={"assignedTo": incident["assignedTo"]},
                )
                log(f"  → Asignado a {incident['assignedTo']}")
            except Exception as e:
                log(f"  ✗ Error asignando: {e}")

        # 3. Cambiar prioridad (si corresponde)
        if incident.get("priority") and autoridad_token:
            try:
                api_request(
                    "PATCH",
                    f"/incidents/{incident_id}/priority",
                    token=autoridad_token,
                    json_body={"priority": incident["priority"]},
                )
                log(f"  → Prioridad establecida: {incident['priority']}")
            except Exception as e:
                log(f"  ✗ Error estableciendo prioridad: {e}")

        # 4. Cambios de estado
        for flow in incident.get("statusFlow", []):
            staff_email = flow["by"]
            if staff_email not in tokens:
                log(f"  ✗ Usuario {staff_email} no tiene token para cambiar estado")
                continue

            try:
                api_request(
                    "PATCH",
                    f"/incidents/{incident_id}",
                    token=tokens[staff_email],
                    json_body={"status": flow["status"],
                               "note": flow.get("note", "")},
                )
                log(f"  → Estado cambiado a '{flow['status']}' por {staff_email}")
            except Exception as e:
                log(f"  ✗ Error cambiando estado: {e}")

        # 5. Agregar comentarios
        for comment in incident.get("comments", []):
            commenter_email = comment["by"]
            if commenter_email not in tokens:
                log(f"  ✗ Usuario {commenter_email} no tiene token para comentar")
                continue

            try:
                api_request(
                    "POST",
                    f"/incidents/{incident_id}/comments",
                    token=tokens[commenter_email],
                    json_body={"text": comment["text"]},
                )
                log(f"  → Comentario agregado por {commenter_email}")
            except Exception as e:
                log(f"  ✗ Error agregando comentario: {e}")

        # 6. Votos de significancia
        for voter in incident.get("significanceVoters", []):
            if voter not in tokens:
                log(f"  ✗ Usuario {voter} no tiene token para votar")
                continue

            try:
                api_request(
                    "POST",
                    f"/incidents/{incident_id}/significance",
                    token=tokens[voter],
                    json_body={},
                )
                log(f"  → Voto de significancia por {voter}")
            except Exception as e:
                # Ignorar errores de voto duplicado
                if "409" not in str(e):
                    log(f"  ✗ Error votando: {e}")

        time.sleep(0.3)  # Pequeña pausa entre incidentes

    log(f"\n📊 Total incidentes creados: {len(created_ids)}/{len(INCIDENTS)}")
    return created_ids


# ============================================================================
# MAIN
# ============================================================================

def print_summary(tokens: Dict[str, str], incident_ids: List[str]):
    """Imprime un resumen final del seed"""
    log(f"\n{'='*60}")
    log("✅ SEED COMPLETADO EXITOSAMENTE")
    log(f"{'='*60}")
    log(f"\n📊 Resumen Final:")
    log(f"  • Usuarios registrados: {len(tokens)}")
    log(f"    - Autoridades: 3")
    log(f"    - Personal: 5")
    log(f"    - Estudiantes: 10")
    log(f"  • Incidentes creados: {len(incident_ids)}")
    log(f"\n🔗 Credenciales de acceso:")
    log(f"  Autoridad: andres.mendoza@utec.edu.pe / Alerta123!")
    log(f"  Personal:  camila.diaz@utec.edu.pe / Alerta123!")
    log(f"  Estudiante: valeria.lopez@utec.edu.pe / Alerta123!")
    log(f"\n🌐 URL del API: {BASE_URL}")
    log(f"{'='*60}\n")


def main():
    """Función principal del seed script"""
    start_time = time.time()

    log(f"\n{'='*60}")
    log("🌱 ALERTAUTEC - SEED SCRIPT")
    log(f"{'='*60}")
    log(f"URL Base: {BASE_URL}")
    log(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"{'='*60}\n")

    try:
        # Verificar conexión al API
        log("🔍 Verificando conexión al API...")
        try:
            response = requests.get(f"{BASE_URL}/", timeout=10)
            log(f"✓ API respondiendo (status: {response.status_code})")
        except Exception as e:
            log(f"⚠️  Advertencia: No se pudo verificar el API: {e}")
            log("   Continuando de todas formas...")

        # Ejecutar seed
        tokens = ensure_users()
        incident_ids = create_incidents(tokens)

        # Resumen final
        elapsed = time.time() - start_time
        print_summary(tokens, incident_ids)
        log(f"⏱️  Tiempo total: {elapsed:.2f} segundos")

        return 0

    except KeyboardInterrupt:
        log("\n\n⚠️  Proceso interrumpido por el usuario")
        return 130

    except Exception as e:
        log(f"\n\n❌ ERROR FATAL: {e}")
        import traceback
        if VERBOSE:
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
