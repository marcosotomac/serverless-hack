import json
import os
from typing import Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError


_sns = boto3.client("sns")


def send_registration_email(
    email: str,
    full_name: Optional[str],
    role: str,
) -> None:
    """Publish a registration notification to SNS with an HTML email payload."""
    topic_arn = os.environ.get("USER_NOTIFICATIONS_TOPIC_ARN")
    if not topic_arn:
        return

    subject = "Bienvenido a AlertaUTEC"
    headline = "Tu acceso ha sido creado"
    recipient_name = full_name or email.split("@", 1)[0]
    preview_text = (
        "Ya puedes reportar, monitorear y resolver incidentes en el campus."
    )

    html_body = f"""<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{subject}</title>
    <style>
      body {{
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
        background-color: #f5f7fb;
        margin: 0;
        padding: 24px;
        color: #0b1f33;
      }}
      .card {{
        max-width: 520px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 18px;
        padding: 32px;
        box-shadow: 0 16px 35px rgba(15, 23, 42, 0.08);
      }}
      .badge {{
        display: inline-flex;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 13px;
        background: linear-gradient(135deg, #2563eb, #14b8a6);
        color: #fff;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }}
      h1 {{
        font-size: 26px;
        margin-top: 22px;
        margin-bottom: 10px;
      }}
      p {{
        line-height: 1.6;
        margin: 10px 0;
      }}
      .cta {{
        margin-top: 26px;
        display: inline-block;
        padding: 14px 26px;
        background: #111827;
        color: #fff;
        border-radius: 14px;
        font-weight: 600;
        text-decoration: none;
      }}
      .footer {{
        margin-top: 26px;
        font-size: 13px;
        color: #64748b;
      }}
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">AlertaUTEC</div>
      <h1>{headline}</h1>
      <p>Hola <strong>{recipient_name}</strong>,</p>
      <p>
        Tu cuenta con rol <strong>{role.capitalize()}</strong> se creó correctamente.
        Ahora podrás reportar incidentes, hacer seguimiento en tiempo real
        y coordinar acciones con las autoridades del campus.
      </p>
      <p>
        Empieza ingresando a la aplicación, configura tus notificaciones
        y mantente atento a los eventos críticos de UTEC.
      </p>
      <a class="cta" href="#" target="_blank" rel="noopener">
        Ir a AlertaUTEC
      </a>
      <p class="footer">{preview_text}</p>
    </div>
  </body>
</html>
"""

    plain_text = (
        f"Hola {recipient_name}, tu cuenta AlertaUTEC ({role}) ya está activa. "
        "Ingresa a la aplicación para comenzar a reportar incidentes."
    )

    message = json.dumps(
        {
            "default": plain_text,
            "email": html_body,
        }
    )

    try:
        _sns.publish(
            TopicArn=topic_arn,
            Message=message,
            MessageStructure="json",
            Subject=subject,
        )
    except (BotoCoreError, ClientError):
        # Ignore SNS failures to avoid blocking registration.
        return

