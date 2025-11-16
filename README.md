AlertaUTEC – Plataforma Serverless de Respuesta a Incidentes
============================================================

Tabla de Contenido
------------------
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura de Referencia](#arquitectura-de-referencia)
3. [Módulos Principales](#módulos-principales)
4. [Catálogo de Endpoints](#catálogo-de-endpoints)
5. [Flujos Operativos Clave](#flujos-operativos-clave)
6. [Despliegue](#despliegue)
7. [Variables de Entorno y Credenciales](#variables-de-entorno-y-credenciales)
8. [Integración con Apache Airflow en ECS Fargate](#integración-con-apache-airflow-en-ecs-fargate)
9. [Buenas Prácticas y Seguridad](#buenas-prácticas-y-seguridad)
10. [Extensiones Futuras](#extensiones-futuras)

Resumen Ejecutivo
-----------------
AlertaUTEC resuelve la gestión integral de incidentes en el campus universitario mediante una arquitectura 100 % serverless. La plataforma permite:

* Registro y autenticación de estudiantes, personal y autoridades.
* Reporte de incidentes con adjuntos multimedia y notas.
* Panel administrativo con filtros avanzados, priorización y cierre.
* Actualización en tiempo real vía WebSockets.
* Historial completo con trazabilidad de cada acción.
* Predicción de patrones y zonas de riesgo usando AWS SageMaker (o heurísticas basadas en históricos).

Se emplean únicamente servicios administrados (Lambda, API Gateway, DynamoDB, S3, SageMaker, Amplify/CloudFront), garantizando escalabilidad automática y costos controlados.

Arquitectura de Referencia
--------------------------

| Capa | Servicio AWS | Descripción |
| ---- | ------------- | ----------- |
| Frontend | Next.js (front-hack-cloud), desplegable en AWS Amplify | UI responsiva para reportes, panel admin y dashboards. |
| API REST | Amazon API Gateway HTTP + AWS Lambda (Python) | Autenticación, gestión de incidentes, histórico, analítica y medios. |
| WebSocket | Amazon API Gateway WebSocket + Lambda | Broadcast de eventos `incident.*` y mantenimiento de conexiones con TTL. |
| Persistencia | Amazon DynamoDB | Tablas `users`, `incidents`, `connections` con índices y TTL. |
| Medios | Amazon S3 (`alertautec-auth-media-<stage>`) | Evidencias (imágenes y videos) vía URLs prefirmadas. |
| Notificaciones | SMTP (Gmail App Password) / SNS opcional | Correos transaccionales al registrar usuarios; extensible a otras alertas. |
| Analítica | AWS Lambda + Amazon SageMaker (endpoint opcional) | Predicciones y hotspots, más heurísticas basadas en históricos. |
| Orquestación | Apache Airflow en ECS Fargate (planificado) | Clasificación automática, reportes y playbooks de respuesta. |

Módulos Principales
-------------------

### Autenticación y Roles
* Perfiles oficiales:
  - **Usuario (estudiante)**: único rol autorizado a crear incidentes y añadir comentarios para dar contexto.
  - **Personal**: equipo operativo asignado por tipo de incidente; puede actualizar estados y resolver tareas.
  - **Autoridad**: control total; asigna incidentes al personal, ajusta prioridades y supervisa cierres.
* `POST /auth/register` y `POST /auth/login` validan correos `@utec.edu.pe`, aplican hashing PBKDF2 y emiten tokens HS256.

### Gestión de Incidentes
* Creación (solo usuarios) con tipo, ubicación, descripción, urgencia, comentarios iniciales y `mediaKeys`.
* Panel administrativo (`/admin/incidents`) permite a las autoridades filtrar por estado/urgencia/prioridad, revisar métricas y ordenar por relevancia o “significancia”.
* Endpoints operativos:
  - `/incidents/{id}`: personal/autoridad cambian estado (pendiente, en_atencion, resuelto).
  - `/incidents/{id}/priority`: autoridades ajustan prioridad estratégica.
  - `/incidents/{id}/close`: personal o autoridad marcan como resuelto y documentan la solución asignada.
* Historial completo (`/incidents/{id}/history`) con responsable, acción, notas, comentarios y timestamps.
* Comentarios: cualquier usuario involucrado puede sumar contextos o actualizaciones textuales adjuntas en el historial.
* Botón de significancia: los usuarios pueden incrementar la relevancia de un incidente; el contador se refleja en el panel para priorizar atención.

### Evidencia Multimedia
* `POST /incidents/media/upload` genera URL prefirmada (PUT) y `objectKey`.
* El cliente sube el archivo directamente a S3 y luego referencia el `objectKey` en `mediaKeys`.

### Tiempo Real (WebSocket)
* Rutas `$connect`, `$disconnect`, `$default`, `ping`.
* Cada conexión se asocia a un usuario/rol y se guarda con TTL en DynamoDB.
* Eventos `incident.created`, `incident.updated`, `incident.priority`, `incident.closed` se envían a autoridades/personal y al reportante.

### Analítica Predictiva
* `POST /analytics/predictions` (roles `personal` y `autoridad`).
* Payload opcional: `location`, `hour` (0‑23), `dayOfWeek` (0‑6).
* Construye features históricos y consulta un endpoint SageMaker (si existe). Si no, utiliza una heurística basada en las estadísticas de DynamoDB.

### Notificaciones
* Al registrar usuarios se envía un correo HTML moderno mediante Gmail SMTP.
* El diseño es responsivo y puede personalizarse en `src/common/notifications.py`.

Catálogo de Endpoints
---------------------

| Método | Ruta | Rol mínimo | Descripción |
| ------ | ---- | ---------- | ----------- |
| POST | `/auth/register` | Público (correo institucional) | Alta de usuario con rol y credenciales |
| POST | `/auth/login` | Público | Emite token de sesión |
| POST | `/incidents` | Autenticado | Reporta incidente con metadata y medios |
| GET | `/incidents` | Autenticado | Lista incidentes (estudiantes ven solo los propios) |
| GET | `/admin/incidents` | Autoridad | Panel con filtros, métricas y ordenamiento |
| PATCH | `/incidents/{incidentId}` | Personal / Autoridad | Cambia estado (pendiente, en_atencion, resuelto) |
| PATCH | `/incidents/{incidentId}/priority` | Autoridad | Ajusta prioridad (baja, media, alta, critica) |
| PATCH | `/incidents/{incidentId}/close` | Personal / Autoridad | Marca como resuelto y registra `closedAt` |
| GET | `/incidents/{incidentId}/history` | Autenticado | Devuelve historial completo del incidente |
| POST | `/incidents/{incidentId}/comments` | Usuario | Agrega comentario contextual al incidente |
| POST | `/incidents/{incidentId}/significance` | Autenticado | Incrementa la relevancia (un voto por usuario) |
| POST | `/incidents/media/upload` | Autenticado | URL prefirmada para subir imágenes/videos |
| POST | `/analytics/predictions` | Personal / Autoridad | Predice patrones y hotspots |

WebSocket rutas: `$connect`, `$disconnect`, `$default`, `ping`.

Flujos Operativos Clave
-----------------------

### Registro y Autenticación
1. `POST /auth/register` → valida correo y rol, almacena hash y envía correo de bienvenida.
2. `POST /auth/login` → devuelve token `Authorization: Bearer <token>` para consumir APIs/WS.

### Reporte con Medios
1. `POST /incidents/media/upload` → recibe `uploadUrl` y `objectKey`.
2. Cliente sube archivo con `PUT uploadUrl`.
3. `POST /incidents` incluye `mediaKeys` con todos los `objectKey`.

### Panel Administrativo
1. `GET /admin/incidents?status=pendiente,en_atencion&priority=alta` → muestra incidentes prioritarios.
2. `PATCH /incidents/{id}/priority` o `/close` → actualiza y dispara eventos WebSocket.
3. `GET /incidents/{id}/history` → revisa trazabilidad antes de tomar decisiones.

### Analítica Predictiva
1. Autoridad solicita `POST /analytics/predictions`.
2. Lambda genera features históricos, llama a SageMaker (si existe endpoint) y entrega hotspots, probabilidades y recomendaciones.

### WebSocket
1. Cliente se conecta a `wss://<api>.execute-api.<region>.amazonaws.com/<stage>?token=<JWT>`.
2. `$connect` valida token y guarda `connectionId`.
3. Un ping periódico (`{"action":"ping"}`) renueva el TTL.
4. Incidentes crean eventos hacia personal/autoridades y al reportante correspondiente.

Despliegue
----------

### Backend
1. Clonar repositorio.
2. Configurar entorno:
   ```
   export AUTH_SECRET="super-secreto"
   export SMTP_FROM_ADDRESS="marco.soto.m@utec.edu.pe"
   export SMTP_USERNAME="marco.soto.m@utec.edu.pe"
   export SMTP_PASSWORD="app-password-gmail"
   export SAGEMAKER_ENDPOINT_NAME="alertautec-incidents-ml"  # opcional
   ```
3. Ejecutar `serverless deploy --stage dev`.
4. Verificar CloudFormation: DynamoDB (`users`, `incidents`, `connections`), S3 (`alertautec-auth-media-dev`), API HTTP/WS, Lambdas.

### Frontend (front-hack-cloud)
1. `cd front-hack-cloud && npm install`.
2. Crear `.env.local`:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://<apiId>.execute-api.us-east-1.amazonaws.com/dev
   NEXT_PUBLIC_WS_ENDPOINT=wss://<wsId>.execute-api.us-east-1.amazonaws.com/dev
   ```
3. Desarrollo local: `npm run dev`.  
4. Producción: Amplify Hosting o Vercel con las mismas variables.

Variables de Entorno y Credenciales
-----------------------------------
* `AUTH_SECRET`: clave HS256 para tokens.
* `SMTP_*`: credenciales y host de correo (se recomienda mover a Secrets Manager antes de publicar).
* `SAGEMAKER_ENDPOINT_NAME`: nombre del endpoint entrenado. Si se omite, se usa heurística.
* `MEDIA_BUCKET_NAME`: generado automáticamente (`alertautec-auth-media-<stage>`).
* `CONNECTION_TTL_SECONDS`: TTL para conexiones WebSocket (default 3600 s).
* Roles IAM: `LabRole` debe incluir permisos DynamoDB, `execute-api:ManageConnections`, `s3:*Object` en el bucket generador.

Integración con Apache Airflow en ECS Fargate
---------------------------------------------
1. **Imagen**: construir `apache/airflow` personalizada y subirla a Amazon ECR.
2. **Cluster Fargate**: crear servicios para `webserver` y `scheduler` (y `worker` si se usa Celery).  
3. **Backend**: Amazon RDS (PostgreSQL) para metadatos y S3/EFS para DAGs/logs.  
4. **Secretos**: almacenar `AIRFLOW__CORE__SQL_ALCHEMY_CONN`, credenciales AWS y tokens en Secrets Manager.  
5. **DAGs sugeridos**:
   * Clasificación automática (invoca `POST /analytics/predictions` o SageMaker).
   * Envío de notificaciones escaladas (SNS/Pinpoint o HTTPOperator hacia API Gateway).
   * Reportes estadísticos (Athena o DynamoDB + export a S3 y envío por correo).
6. **Seguridad**: Task Role con permisos mínimos (DynamoDB, SNS, Lambda invoke, SageMaker runtime).  
7. **Exposición**: Application Load Balancer con acceso autenticado (por ejemplo, IAM o Cognito) para el webserver.

Buenas Prácticas y Seguridad
----------------------------
* **Credenciales**: no almacenar `SMTP_PASSWORD` ni `AUTH_SECRET` en texto plano en el repositorio público; usar Secrets Manager o SSM.
* **Permisos mínimos**: limitar políticas IAM al alcance necesario.
* **Network**: habilitar HTTPS (API Gateway ya lo proporciona). Para el frontend se recomienda CloudFront/Amplify con TLS.
* **Monitoreo**: activar CloudWatch Logs/Alarms para Lambdas y API Gateway.
* **Costos**: eliminar stacks y buckets cuando termine el hackathon.

Extensiones Futuras
-------------------
* **EventBridge + Step Functions** para orquestar playbooks automáticos de respuesta.
* **Amazon Pinpoint / SNS** para notificaciones push/SMS segmentadas.
* **Dashboards con Amazon QuickSight** alimentados por Athena sobre datos históricos (posiblemente usando Kinesis Firehose).
* **Integración Amazon IoT Core** para que sensores físicos creen incidentes.
* **Autenticación Cognito o SSO institucional** para mejorar la experiencia de acceso.

Créditos
--------
Proyecto diseñado y desarrollado por el equipo **AlertaUTEC** durante el Hackathon Cloud Computing UTEC.  
Tecnologías principales: AWS Lambda, API Gateway (HTTP y WebSocket), DynamoDB, S3, SageMaker, SNS/SMTP, Next.js, Serverless Framework.
