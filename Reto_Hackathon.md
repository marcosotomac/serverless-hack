AlertaUTEC - Hackathon Cloud Computing UTEC
Contexto
La Universidad de Ingeniería y Tecnología (UTEC), como toda institución educativa, enfrenta
diversos incidentes dentro de su campus: desde problemas de infraestructura y fallas en los
servicios, hasta situaciones de emergencia que requieren atención inmediata. Sin embargo,
muchos de estos incidentes pasan desapercibidos o no son atendidos con la rapidez y eficacia
necesarias por las áreas responsables.
Ante esta situación, la universidad los ha convocado para diseñar una solución tecnológica
que permita reportar , gestionar y dar seguimiento a los incidentes dentro del campus de
manera ágil, segura y centralizada , facilitando la comunicación entre los estudiantes, el
personal administrativo y las autoridades competentes.
Objetivos del Proyecto
El objetivo principal del proyecto AlertaUTEC  es desarrollar una plataforma 100% serverless
que permita reportar , monitorear y gestionar incidentes dentro del campus universitario
en tiempo real , optimizando la comunicación entre los usuarios y las autoridades
correspondientes.
Objetivos específicos
Diseñar una arquitectura completamente serverless , aprovechando servicios
gestionados en la nube (como Amplify , AWS Lambda, API Gateway , DynamoDB y S3) para
garantizar escalabilidad, alta disponibilidad y bajo mantenimiento.
Implementar comunicación en tiempo real mediante W ebSockets , permitiendo que los
reportes, actualizaciones de estado y notificaciones de incidentes se sincronicen
instantáneamente entre los usuarios y el panel de control administrativo.
Orquestar y automatizar los flujos de procesamiento con Apache Airflow , gestionando
tareas como la clasificación automática de incidentes, envío de alertas, análisis de patrones
y generación de reportes periódicos.
Apache Airflow debe desplegarse en un contenedor ejecutándose en Amazon
ECS (idealmente sobre Fargate)  como parte de la solución.
Garantizar una experiencia fluida y segura para los usuarios , asegurando
autenticación, control de roles (estudiante, personal, autoridad) y trazabilidad de cada
incidente reportado.
Proveer herramientas de análisis y visualización , que permitan identificar tendencias,
zonas críticas o recurrencia de incidentes en el campus. Esto, idealmente, usando algún

Requerimientos Funcionalesmodelo entrenado de AWS SageMaker .
1. Registro y autenticación de usuarios
El sistema debe permitir el registro e inicio de sesión de usuarios mediante
credenciales institucionales.
Se debe distinguir entre roles: estudiante , personal administrativo  y autoridad .
2. Reporte de incidentes
Los usuarios deben poder crear reportes de incidentes indicando tipo, ubicación,
descripción y nivel de urgencia.
Cada incidente debe almacenarse en una base de datos serverless  (por ejemplo,
DynamoDB).
Se debe generar   wss://z3k9ammp3f.execute-api.us-east-1.amazonaws.com/devautomáticamente un identificador único por reporte.
3. Actualización y seguimiento en tiempo real
El sistema debe actualizar el estado de los incidentes en tiempo real utilizando
WebSockets  a través de API Gateway .
Los usuarios y las autoridades deben recibir notificaciones instantáneas cuando un
incidente cambie de estado (pendiente, en atención, resuelto).
4. Panel administrativo
Los usuarios con rol de autoridad deben poder visualizar un panel con todos los
incidentes activos.
El panel debe permitir filtrar , priorizar y cerrar  reportes.
Las actualizaciones del panel deben reflejarse en tiempo real sin necesidad de recargar
la página.
5. Orquestación de flujos con Apache Airflow
Se debe integrar Apache Airflow  para gestionar y automatizar tareas como:
Clasificación automática de incidentes por tipo o nivel de urgencia.
Envío de notificaciones a las áreas responsables.
Generación periódica de reportes estadísticos.
6. Gestión de notificaciones
El sistema debe enviar alertas en tiempo real mediante W ebSocket y notificaciones
asíncronas (correo o SMS) según la gravedad del incidente.
7. Historial y trazabilidad
Cada incidente debe contar con un historial completo de acciones (creación,
actualizaciones, responsables, fecha y hora).
8. Escalabilidad y resiliencia

Todos los componentes deben ser serverless  y escalables automáticamente,
soportando múltiples reportes simultáneos y conexiones W ebSocket activas.
9. Análisis Predictivo y visualización inteligente (opcional)
El sistema debe integrar un modelo de machine learning entrenado en AWS
SageMaker  para analizar los reportes históricos de incidentes.
El modelo debe ser capaz de identificar patrones, zonas de riesgo y tendencias de
recurrencia , generando predicciones sobre los tipos de incidentes más probables en
determinadas áreas del campus o en horarios específicos.

