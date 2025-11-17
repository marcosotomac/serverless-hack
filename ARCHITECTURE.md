![AlertaUTEC Architecture](https://raw.githubusercontent.com/marcosotomac/serverless-hack/main/docs/architecture-diagram.png)

# Arquitectura de AlertaUTEC

> Documento técnico para comprender cómo se orquesta cada componente del ecosistema serverless **AlertaUTEC**. Incluye diagrama visual, flujos de datos y decisiones clave.

---

## 🌐 Visión General

AlertaUTEC es una plataforma 100 % serverless orientada a gestionar incidentes en campus universitario con tiempo real, analítica inteligente y trazabilidad completa. Sus piezas principales se describen en este diagrama:

```mermaid
flowchart TB
    subgraph Frontend
        A1[Next.js / Amplify Hosting]
        A2[Websocket Client]
    end

    subgraph API Gateway
        B1[HTTP API]
        B2[WebSocket API]
    end

    subgraph Lambda Core
        C1[Auth Lambdas]
        C2[Incident Lambdas \(create/update/comment/assign\)]
        C3[Analytics Lambdas \(Export, Predict, Realtime\)]
        C4[Media/Layers]
    end

    subgraph Data Layer
        D1[(DynamoDB Users)]
        D2[(DynamoDB Incidents)]
        D3[(DynamoDB Connections)]
        D4[(S3 Media Bucket)]
        D5[(Athena + S3 Resultados)]
    end

    subgraph Integraciones
        E1[SMTP \(Gmail\)]
        E2[SageMaker Endpoint]
        E3[Airflow en ECS Fargate \(Planeado\)]
    end

    A1 -->|REST/JSON| B1
    A2 -->|WS| B2
    B1 -->|Invoke| C1
    B1 -->|Invoke| C2
    B1 -->|Invoke| C3
    B2 -->|routes| C2

    C1 --> D1
    C2 --> D2
    C2 --> D3
    C2 --> D4
    C3 --> D2
    C3 --> D5

    C1 -->|Correo registro| E1
    C2 -->|Predict| E2
    C3 -->|Flujos ETL / DAGs| E3

    B2 <-->|push events| C2
```

---

## 🧩 Componentes Detallados

### Frontend (Next.js + Amplify/Vercel)
- Interfaces para **estudiantes** (reporte y comentarios), **personal** (tareas asignadas) y **autoridades** (panel administrativo).
- Consume el HTTP API para CRUD y se conecta al WebSocket para notificaciones push (`incident.created`, `incident.updated`, `incident.comment`, etc.).
- Upload de media: obtiene URL prefirmada (`/incidents/media/upload`) y envía archivos directo a S3.

### API Gateway
- **HTTP API**: expone todos los endpoints REST (auth, incidentes, analytics, admin).
- **WebSocket API**: canal bidireccional con rutas `$connect/$disconnect/$default/ping`. Los eventos se propagan a roles y usuarios específicos.

### Lambdas Principales
1. **Autenticación (`src/handlers/auth/*`)**
   - Registra usuarios institucionales (`@utec.edu.pe`), aplica PBKDF2.
   - Emite tokens HS256 (sin Cognito para mantener total control).
   - Envío de correo HTML al registrarse (SMTP Gmail).

2. **Incidentes (`src/handlers/incidents/*`)**
   - Creación (solo estudiantes) con validaciones, media, historial.
   - Comentarios, votos de significancia, asignaciones, cambios de estado y cierre.
   - Panel administrativo (`/admin/incidents`) con filtros y métricas.
   - Seed script (`scripts/seed_data.py`) crea 30 usuarios base.

3. **Analytics**
   - `realtime.py`: métricas en tiempo real sin Athena.
   - `get_analytics.py`: consulta Athena (DynamoDB exportado a S3).
   - `export.py`: genera PDF/Excel/CSV (via `reportlab`, `openpyxl`).
   - `predict.py`: invoca SageMaker o heurística para hotspots y probabilidad por zona/hora.

4. **Media y WebSocket Utilities**
   - `request_upload`: URLs prefirmadas de S3 y metadata asociada al incidente.
   - `get_media_url`: lectura segura de archivos (firma temporal).
   - `websocket.py`: envía broadcast a roles específicos y limpia conexiones obsoletas (TTL en DynamoDB).

### Persistencia
- **DynamoDB Users**: email hash, hash de password, rol, timestamps.
- **DynamoDB Incidents**: PK `incidentId`, historial (`history` list), `comments`, `media`, `significanceCount`.
- **DynamoDB Connections**: `connectionId`, `role`, `user`, TTL para limpiar WebSockets.
- **S3 Media Bucket**: `alertautec-auth-media-<stage>` con CORS y bloqueos públicos.
- **S3 Analytics Buckets**: datos crudos (`...-analytics-data-<stage>`) y resultados de Athena (`...-analytics-results-<stage>`).

### Integraciones
- **SMTP (Gmail App Password)**: envía correos de bienvenida y comunicados transaccionales.
- **SageMaker**: modelo para predicciones (tendencias, hotspots). Si no existe, se usa heurística con históricos.
- **Airflow (ECS Fargate)**: planeado para orquestar DAGs: clasificación automática, notificaciones y reportes periódicos.

---

## 🔁 Flujos de Datos Clave

1. **Registro & Login**
   - `POST /auth/register` → valida correo, rol, hash PBFK2 → DynamoDB Users → correo SMTP.
   - `POST /auth/login` → genera token HS256 → front guarda en `localStorage`/cookies.

2. **Reporte de Incidente**
   - Estudiante solicita `POST /incidents/media/upload`, sube evidencia, luego `POST /incidents`.
   - Se guarda en DynamoDB, se agrega historial, se envía evento WebSocket a autoridades/personal y notificación al reportante.

3. **Gestión en Panel Admin**
   - `GET /admin/incidents` filtra (status, urgencia, prioridad, significancia).
   - Acciones (`PATCH /.../priority`, `/assign`, `/close`) actualizan DynamoDB y disparan WebSocket + correos si aplica.

4. **Comentarios & Significancia**
   - `POST /incidents/{id}/comments`: solo estudiantes, se registra historial y se notifica.
   - `POST /.../significance`: cualquier rol, incrementa contador y aparece en dashboard (se evita doble voto con DynamoDB sets).

5. **Analítica & Export**
   - `syncToS3`: Lambda programada que exporta incidentes a S3 (Parquet/CSV) para Athena.
   - `get_analytics`/`realtime`/`predict` consultan datos y devuelven dashboards.
   - `export`: genera PDF/Excel/CSV usando `reportlab`/`openpyxl`, retorna blob descargable.

---

## 🔐 Seguridad y Roles

| Rol | Capacidades principales |
| --- | ----------------------- |
| **Estudiante (usuario)** | Crear incidentes, comentar, votar significancia, consultar historial propio. |
| **Personal** | Ver incidentes asignados, cambiar estado, cerrar casos, recibir asignaciones vía WebSocket. |
| **Autoridad** | Panel completo, asignar, ajustar prioridades, forzar cierres, ejecutar analítica, exportar reportes. |

Notas:
- Validación de token personalizada (`decode_session_token`) + decorador `@authorize`.
- CORS en API Gateway abierto (`*`) para simplificar front.
- WebSockets usan TTL para limpiar conexiones abandonadas.

---

## 🚀 Cómo navegar este documento
- Usa el diagrama Mermaid para tener una vista holística.
- Revisa cada sección para conocer responsabilidades y flujos.
- Para details operativos (deploy, seed, endpoints) consulta el `README.md`.

> **Consejo**: combina este documento con el script `scripts/seed_data.py` para levantar entornos de prueba listos con usuarios de todos los roles.
