VALID_URGENCY = {"baja", "media", "alta", "critica"}
VALID_STATUS = {"pendiente", "en_atencion", "resuelto"}
VALID_PRIORITY = {"baja", "media", "alta", "critica"}


def normalize_status(value: str) -> str:
    normalized = value.strip().lower()
    if normalized not in VALID_STATUS:
        raise ValueError("Estado inválido. Usa pendiente, en_atencion o resuelto.")
    return normalized


def normalize_urgency(value: str) -> str:
    normalized = value.strip().lower()
    if normalized not in VALID_URGENCY:
        raise ValueError("Urgencia inválida. Usa baja, media, alta o critica.")
    return normalized


def normalize_priority(value: str) -> str:
    normalized = value.strip().lower()
    if normalized not in VALID_PRIORITY:
        raise ValueError("Prioridad inválida. Usa baja, media, alta o critica.")
    return normalized
