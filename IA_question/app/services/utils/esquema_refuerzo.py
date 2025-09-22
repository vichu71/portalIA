# app/services/utils/esquema_refuerzo.py


# Palabras clave del dominio (relacionadas con el esquema de la base de datos)
PALABRAS_CLAVE_DOMINIO = {
    "examinado", "examinados", "encuesta", "encuestas",
    "examen", "examenes", "exámenes", "habilidad", "habilidades",
    "modulo", "módulo", "modulos", "módulos", "sector", "sectores",
    "usuario", "usuarios", "alumno", "alumnos", "prueba", "pruebas",
    "test", "tests", "evaluacion", "evaluación", "evaluaciones",
    "talento", "resultados", "historial", "evaluado", "evaluada",
    "evaluados", "evaluadas"
}

# Palabras clave más específicas del tipo 2
PALABRAS_CLAVE_TIPO_2 = {
    "nota", "resultado", "resultados", "historial", "evaluación",
    "examen", "exámenes", "habilidades", "puntuación", "score",
    "completados", "realizó", "completó"
}


def reforzar_clasificacion(texto: str, clase_inicial: int) -> int:
    """
    Refuerza la clasificación de una pregunta en función del contexto (palabras clave)
    y la presencia de entidades PERSONA si la clase es 1.
    Reglas:
    - Si NO contiene palabras clave de dominio, forzar a tipo 0.
    - Si contiene palabras clave y era tipo 0 → subir a 1.
    - Si contiene entidades PERSONA y era tipo 1 → subir a 2.
    """

    from app.services.classifier_utils import extraer_entidades 

    texto_lower = texto.lower()

    contiene_dominio = any(palabra in texto_lower for palabra in PALABRAS_CLAVE_DOMINIO)
    if not contiene_dominio:
        return 0  # si no está relacionada con el dominio, es general sí o sí

    clase_reforzada = clase_inicial

    if clase_inicial == 0:
        clase_reforzada = 1

    if clase_reforzada == 1:
        entidades = extraer_entidades(texto)
        if any(e[1] == "PER" for e in entidades):
            clase_reforzada = 2

    return clase_reforzada


def es_pregunta_de_tipo_2_basada_en_contexto(texto: str, entidades: list) -> bool:
    """
    Comprueba si una pregunta debería tratarse como tipo 2 (contexto + entidad).
    """
    texto_lower = texto.lower()
    hay_persona = any(ent[1] == "PER" for ent in entidades)
    contiene_clave = any(p in texto_lower for p in PALABRAS_CLAVE_TIPO_2)
    return hay_persona and contiene_clave

