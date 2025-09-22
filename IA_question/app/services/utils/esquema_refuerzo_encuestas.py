# app/services/utils/esquema_refuerzo.py

# Palabras clave generales del dominio de encuestas políticas
PALABRAS_CLAVE_DOMINIO = {
    "encuesta", "encuestas", "satisfacción", "política", "gobierno",
    "opinión", "situación", "económica", "españa", "voto", "intención",
    "partido", "partidos", "evaluación", "resultados", "respuestas",
    "porcentaje", "test", "tests", "módulo", "módulos", "sector", "sectores",
    "estadísticas", "completados", "respuesta", "participantes"
}

# Palabras clave políticas específicas (basadas en las encuestas mostradas)
PALABRAS_CLAVE_POLITICAS = {
    "gobierno", "situación política", "unión europea", "andalucía", 
    "ejército común", "defensa", "partidos políticos", "presidente", 
    "situación económica", "satisfecho", "insatisfecho", "neutral",
    "españa", "opinión", "confianza", "presidente", "líderes"
}

# Palabras clave demográficas
PALABRAS_CLAVE_DEMOGRAFICAS = {
    "hombre", "mujer", "edad", "provincia", "nacionalidad", "española",
    "almería", "cádiz", "córdoba", "granada", "huelva", "jaén", "málaga", "sevilla",
    "18 a 24", "25 a 34", "35 a 44", "45 a 54", "55 a 64", "65 a 74", "75"
}

# Palabras clave para análisis específicos (tipo 2)
PALABRAS_CLAVE_TIPO_2 = {
    "porcentaje", "provincia", "segmento", "grupo", "rango", "edad", "género",
    "hombres", "mujeres", "jóvenes", "mayores", "región", "económica",
    "apoyan", "residen", "prefieren", "consideran", "calificación", "relación",
    "distribución", "correlación", "personas", "encuestados", "votantes"
}

# Líderes políticos específicos (basados en la encuesta)
LIDERES_POLITICOS = {
    "pedro sánchez", "alberto núñez feijoo", "santiago abascal", 
    "isabel díaz ayuso", "alvise pérez", "irene montero"
}

def reforzar_clasificacion(texto: str, clase_inicial: int) -> int:
    """
    Refuerza la clasificación de una pregunta en función del contexto específico
    de encuestas políticas y de opinión:
    
    Reglas:
    - Tipo 0: Pregunta general (no relacionada con encuestas)
    - Tipo 1: Pregunta sobre encuestas/estadísticas generales
    - Tipo 2: Pregunta sobre datos específicos o segmentación demográfica
    """
    from app.services.classifier_utils import extraer_entidades
    
    texto_lower = texto.lower()
    
    # Verificar si la pregunta está relacionada con el dominio
    contiene_dominio = any(palabra in texto_lower for palabra in PALABRAS_CLAVE_DOMINIO)
    contiene_politica = any(palabra in texto_lower for palabra in PALABRAS_CLAVE_POLITICAS)
    
    if not (contiene_dominio or contiene_politica):
        return 0  # Si no está relacionada con el dominio, es general
    
    # Detectar si es una pregunta de análisis específico (tipo 2)
    contiene_tipo2 = any(palabra in texto_lower for palabra in PALABRAS_CLAVE_TIPO_2)
    contiene_lider = any(lider in texto_lower for lider in LIDERES_POLITICOS)
    contiene_demografica = any(palabra in texto_lower for palabra in PALABRAS_CLAVE_DEMOGRAFICAS)
    
    # Extraer entidades para identificar personas, lugares o porcentajes específicos
    entidades = extraer_entidades(texto)
    hay_persona = any(ent[1] == "PER" for ent in entidades)
    hay_lugar = any(ent[1] == "LOC" for ent in entidades)
    
    # Comprobar patrones específicos de segmentación
    patrones_segmentacion = [
        "porcentaje", "cuántos", "cuántas", "proporción", "comparativa",
        "diferencia", "grupo", "segmento", "rango", "varía", "relación"
    ]
    es_segmentacion = any(patron in texto_lower for patron in patrones_segmentacion)
    
    # Reglas de refuerzo:
    # Si tiene elementos de segmentación o específicos, es tipo 2
    if contiene_tipo2 or contiene_lider or hay_persona or hay_lugar or (contiene_demografica and es_segmentacion):
        return 2
    
    # Si tiene elementos del dominio pero no especificidad, es tipo 1
    if contiene_dominio or contiene_politica:
        return 1
    
    # Por defecto, mantener la clasificación inicial
    return clase_inicial


def es_pregunta_de_tipo_2_basada_en_contexto(texto: str, entidades: list) -> bool:
    """
    Determina si una pregunta debería clasificarse como tipo 2 basándose en el contexto
    específico de encuestas políticas (análisis detallado o segmentado).
    """
    texto_lower = texto.lower()
    
    # Verificar si hay lugares, personas o patrones de segmentación
    hay_persona = any(ent[1] == "PER" for ent in entidades)
    hay_lugar = any(ent[1] == "LOC" for ent in entidades)
    hay_lider = any(lider in texto_lower for lider in LIDERES_POLITICOS)
    
    # Patrones de segmentación o análisis específico
    patrones_analisis = [
        "porcentaje", "cuántos", "proporción", "comparativa", "diferencia",
        "grupo", "segmento", "rango", "edad", "género", "provincia",
        "varía", "relación entre", "correlación", "análisis", "específico",
        "mayoría", "minoría", "tendencia", "hombres", "mujeres"
    ]
    es_analisis = any(patron in texto_lower for patron in patrones_analisis)
    
    # Si combina entidades específicas con patrones de análisis, es tipo 2
    return (hay_persona or hay_lugar or hay_lider) and es_analisis
