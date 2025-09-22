
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document
import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from html import unescape

# Configuración del logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Usar Path para manejo de rutas más seguro
INDEX_PATH = Path("/home/cestel/IA_question/indices/faiss_metroscopico.index")

def extraer_texto_html(html_text: Optional[str]) -> str:
    """Extrae texto plano de cadenas HTML básicas."""
    if not html_text:
        return ""
    # Eliminar etiquetas HTML comunes y decodificar entidades HTML
    return unescape(html_text.replace("<p>", "").replace("</p>", "").strip())

def identificar_pregunta_sexo(parsed_body: Dict[str, Any]) -> Optional[str]:
    """
    Identifica la pregunta relacionada con sexo/género en una encuesta.

    Args:
        parsed_body: Estructura JSON de la encuesta ya parseada

    Returns:
        Nombre de la pregunta o None si no se encontró
    """
    try:
        pages = parsed_body.get("pages", [])

        for page in pages:
            elements = page.get("elements", [])
            for element in elements:
                nombre = element.get("name", "")
                titulo = element.get("title", "")
                titulo_texto = extraer_texto_html(titulo).lower()
                tipo = element.get("type", "").lower()

                # Palabras clave relacionadas con género/sexo
                keywords_sexo = ["sexo", "género", "genero"]

                # Comprobar en el título de la pregunta
                if any(keyword in titulo_texto for keyword in keywords_sexo):
                    logger.info(f"✅ Pregunta de sexo identificada por título: {nombre}")
                    return nombre

                # Comprobar en el nombre de la pregunta
                nombre_lower = nombre.lower()
                if any(keyword in nombre_lower for keyword in keywords_sexo):
                    logger.info(f"✅ Pregunta de sexo identificada por nombre: {nombre}")
                    return nombre

                # Verificar opciones si es radiogroup o dropdown (formatos comunes para preguntas de sexo)
                if tipo in ["radiogroup", "dropdown"]:
                    choices = element.get("choices", [])
                    opciones_texto = []

                    for choice in choices:
                        if isinstance(choice, dict):
                            texto = extraer_texto_html(choice.get("text", "")).lower()
                            opciones_texto.append(texto)
                        else:
                            opciones_texto.append(str(choice).lower())

                    # Si las opciones incluyen hombre/mujer o masculino/femenino
                    if (("hombre" in opciones_texto or "masculino" in opciones_texto) and
                        ("mujer" in opciones_texto or "femenino" in opciones_texto)):
                        logger.info(f"✅ Pregunta de sexo identificada por opciones: {nombre}")
                        return nombre

        logger.info("❌ No se identificó ninguna pregunta relacionada con sexo/género")
        return None
    except Exception as e:
        logger.error(f"Error identificando pregunta de sexo: {e}")
        return None

def decodificar_respuestas(encuesta):
    """
    Decodifica los valores de las respuestas según la estructura de la encuesta.
    """
    body = encuesta.get("body", "{}")
    respuestas = encuesta.get("respuestas", [])
    
    try:
        # Extraer la estructura
        estructura = json.loads(body) if isinstance(body, str) else body
        
        # Crear mapeo de valores por pregunta
        mapeo_valores = {}
        
        # Extraer todos los posibles valores de cada pregunta
        for page in estructura.get("pages", []):
            for elemento in page.get("elements", []):
                nombre_pregunta = elemento.get("name")
                tipo = elemento.get("type")
                titulo = extraer_texto_html(elemento.get("title", ""))
                
                # Inicializar el mapeo para esta pregunta
                mapeo_valores[nombre_pregunta] = {
                    "tipo": tipo,
                    "titulo": titulo,
                    "valores": {},
                    "respuestas_raw": [],
                    "respuestas_decodificadas": []
                }
                
                # Procesar las opciones para preguntas de selección
                if tipo in ["radiogroup", "dropdown", "checkbox"]:
                    opciones = elemento.get("choices", [])
                    
                    for opcion in opciones:
                        if isinstance(opcion, dict):
                            valor = opcion.get("value", "")
                            texto = extraer_texto_html(opcion.get("text", ""))
                            mapeo_valores[nombre_pregunta]["valores"][valor] = texto
                        else:
                            # Si la opción es directamente un string
                            mapeo_valores[nombre_pregunta]["valores"][str(opcion)] = str(opcion)
        
        # Procesar respuestas usando el mapeo
        for respuesta in respuestas:
            if isinstance(respuesta, dict) and "data" in respuesta:
                data = respuesta.get("data", {})
                
                for pregunta, valor in data.items():
                    if pregunta in mapeo_valores:
                        # Guardar el valor raw
                        mapeo_valores[pregunta]["respuestas_raw"].append(valor)
                        
                        # Decodificar si es posible
                        if valor in mapeo_valores[pregunta]["valores"]:
                            texto_decodificado = mapeo_valores[pregunta]["valores"][valor]
                            mapeo_valores[pregunta]["respuestas_decodificadas"].append(texto_decodificado)
                        else:
                            # Si no podemos decodificar, usamos el valor original
                            mapeo_valores[pregunta]["respuestas_decodificadas"].append(valor)
        
        # Generar conteos para cada pregunta
        for pregunta, info in mapeo_valores.items():
            conteo_raw = {}
            conteo_decodificado = {}
            
            for valor in info["respuestas_raw"]:
                if valor not in conteo_raw:
                    conteo_raw[valor] = 0
                conteo_raw[valor] += 1
            
            for valor in info["respuestas_decodificadas"]:
                if valor not in conteo_decodificado:
                    conteo_decodificado[valor] = 0
                conteo_decodificado[valor] += 1
            
            info["conteo_raw"] = conteo_raw
            info["conteo_decodificado"] = conteo_decodificado
        
        return mapeo_valores
        
    except Exception as e:
        logger.error(f"Error decodificando respuestas: {e}")
        return {}

def obtener_estadisticas_pregunta(encuesta, nombre_pregunta):
    """
    Obtiene estadísticas detalladas de una pregunta específica.
    """
    mapeo = decodificar_respuestas(encuesta)
    
    if nombre_pregunta not in mapeo:
        return {
            "error": f"Pregunta '{nombre_pregunta}' no encontrada en la encuesta"
        }
    
    info_pregunta = mapeo[nombre_pregunta]
    total_respuestas = len(info_pregunta["respuestas_raw"])
    
    if total_respuestas == 0:
        return {
            "pregunta": nombre_pregunta,
            "titulo": info_pregunta["titulo"],
            "tipo": info_pregunta["tipo"],
            "total_respuestas": 0,
            "conteos": {},
            "porcentajes": {}
        }
    
    return {
        "pregunta": nombre_pregunta,
        "titulo": info_pregunta["titulo"],
        "tipo": info_pregunta["tipo"],
        "total_respuestas": total_respuestas,
        "conteos": info_pregunta["conteo_decodificado"],
        "porcentajes": {
            texto: round((conteo / total_respuestas) * 100, 2)
            for texto, conteo in info_pregunta["conteo_decodificado"].items()
        }
    }

def obtener_distribucion_genero(encuesta):
    """
    Busca la pregunta de género y devuelve su distribución.
    """
    # Decodificar todas las respuestas
    mapeo = decodificar_respuestas(encuesta)
    
    # Buscar la pregunta de género
    pregunta_sexo = None
    for nombre, info in mapeo.items():
        titulo = info["titulo"].lower()
        if "sexo" in titulo or "género" in titulo or "genero" in titulo:
            pregunta_sexo = nombre
            break
    
    if not pregunta_sexo:
        return {"error": "No se encontró pregunta de género en la encuesta"}
    
    # Obtener estadísticas de la pregunta
    return obtener_estadisticas_pregunta(encuesta, pregunta_sexo)


def contar_respuestas_por_genero(respuestas, pregunta_sexo, encuesta=None):
    """
    Cuenta cuántas mujeres y hombres respondieron a la encuesta usando el mapeo inteligente.
    """
    if not encuesta:
        # Fallback al comportamiento anterior
        logger.warning("No se proporcionó encuesta completa para decodificación inteligente")
        mujeres = 0
        hombres = 0
        
        for respuesta in respuestas:
            try:
                if isinstance(respuesta, dict) and "data" in respuesta:
                    data = respuesta.get("data", {})
                    valor = str(data.get(pregunta_sexo, "")).lower()
                    
                    if any(term in valor for term in ["mujer", "femenino", "f"]):
                        mujeres += 1
                    elif any(term in valor for term in ["hombre", "masculino", "m", "varon"]):
                        hombres += 1
            except Exception as e:
                logger.error(f"Error contando género (método antiguo): {e}")
        
        return mujeres, hombres
    
    # Usar el nuevo método basado en la estructura de la encuesta
    stats = obtener_estadisticas_pregunta(encuesta, pregunta_sexo)
    
    if "error" in stats:
        logger.error(f"Error obteniendo estadísticas: {stats['error']}")
        return 0, 0
    
    mujeres = 0
    hombres = 0
    
    # Contar basado en los textos decodificados
    for texto, conteo in stats["conteos"].items():
        texto_lower = texto.lower()
        if "mujer" in texto_lower or "femenino" in texto_lower:
            mujeres += conteo
        elif "hombre" in texto_lower or "masculino" in texto_lower or "varón" in texto_lower:
            hombres += conteo
    
    logger.info(f"📊 Conteos por género usando decodificación: {mujeres} mujeres, {hombres} hombres")
    logger.info(f"📊 Distribución completa: {stats['conteos']}")
    
    return mujeres, hombres

def procesar_estructura_encuesta(body: str) -> Tuple[str, Optional[Dict[str, Any]], Optional[str]]:
    """
    Procesa la estructura JSON de una encuesta y devuelve un texto formateado.
    
    Args:
        body: JSON de la estructura de la encuesta
        
    Returns:
        Tupla con (texto_estructura, parsed_body, nombre_pregunta_sexo)
    """
    try:
        if not body or body == "{}":
            return "(No hay estructura disponible)\n", None, None

        parsed_body = json.loads(body)
        
        # Buscar la pregunta de género
        pregunta_sexo = None
        for page in parsed_body.get("pages", []):
            for element in page.get("elements", []):
                nombre = element.get("name", "")
                titulo = extraer_texto_html(element.get("title", "")).lower()
                
                if "sexo" in titulo or "género" in titulo or "genero" in titulo:
                    pregunta_sexo = nombre
                    logger.info(f"✅ Pregunta de sexo identificada por título: {nombre}")
                    break
                
                # Si no la encontramos por título, buscar por opciones
                if element.get("type") in ["radiogroup", "dropdown"]:
                    choices = element.get("choices", [])
                    opciones = []
                    
                    for choice in choices:
                        if isinstance(choice, dict):
                            texto = extraer_texto_html(choice.get("text", "")).lower()
                            opciones.append(texto)
                        else:
                            opciones.append(str(choice).lower())
                    
                    if ("hombre" in opciones and "mujer" in opciones) or ("masculino" in opciones and "femenino" in opciones):
                        pregunta_sexo = nombre
                        logger.info(f"✅ Pregunta de sexo identificada por opciones: {nombre}")
                        break
        
        pages = parsed_body.get("pages", [])
        if not pages:
            return "(Encuesta sin páginas de preguntas)\n", parsed_body, pregunta_sexo

        content = []
        for i, page in enumerate(pages):
            if i > 0:
                content.append(f"\nPágina {i+1}:")
            else:
                content.append(f"Página {i+1}:")

            elements = page.get("elements", [])
            if not elements:
                content.append("(Sin preguntas)")
                continue

            for element in elements:
                nombre_pregunta = element.get("name", "")
                titulo = extraer_texto_html(element.get("title", ""))
                tipo = element.get("type", "unknown")

                # Marcar si es la pregunta de sexo
                es_pregunta_sexo = " [PREGUNTA DE SEXO/GÉNERO]" if nombre_pregunta == pregunta_sexo else ""
                pregunta_texto = f"- {nombre_pregunta}: {titulo} [Tipo: {tipo}]{es_pregunta_sexo}"

                # Procesar opciones de respuesta
                choices = element.get("choices", [])
                if choices:
                    opciones = []
                    for c in choices:
                        if isinstance(c, dict):
                            text = extraer_texto_html(c.get("text", ""))
                            value = c.get("value", "")
                            opciones.append(f"{text} ({value})")
                        else:
                            opciones.append(str(c))

                    if opciones:
                        pregunta_texto += f"\n  Opciones: {', '.join(opciones)}"

                content.append(pregunta_texto)

        return "\n".join(content), parsed_body, pregunta_sexo

    except json.JSONDecodeError as e:
        logger.error(f"Error de formato JSON: {e}")
        return f"(Error al procesar JSON de la estructura: {e})\n", None, None
    except Exception as e:
        logger.error(f"Error inesperado procesando estructura: {e}")
        return f"(Error al procesar estructura: {e})\n", None, None

def procesar_estructura_encuesta(body: str) -> Tuple[str, Optional[Dict[str, Any]], Optional[str]]:
    """
    Procesa la estructura JSON de una encuesta y devuelve un texto formateado.

    Args:
        body: JSON de la estructura de la encuesta

    Returns:
        Tupla con (texto_estructura, parsed_body, nombre_pregunta_sexo)
    """
    try:
        if not body or body == "{}":
            return "(No hay estructura disponible)\n", None, None

        parsed_body = json.loads(body)
        pregunta_sexo = identificar_pregunta_sexo(parsed_body)

        pages = parsed_body.get("pages", [])
        if not pages:
            return "(Encuesta sin páginas de preguntas)\n", parsed_body, pregunta_sexo

        content = []
        for i, page in enumerate(pages):
            if i > 0:
                content.append(f"\nPágina {i+1}:")
            else:
                content.append(f"Página {i+1}:")

            elements = page.get("elements", [])
            if not elements:
                content.append("(Sin preguntas)")
                continue

            for element in elements:
                nombre_pregunta = element.get("name", "")
                titulo = extraer_texto_html(element.get("title", ""))
                tipo = element.get("type", "unknown")

                # Marcar si es la pregunta de sexo
                es_pregunta_sexo = " [PREGUNTA DE SEXO/GÉNERO]" if nombre_pregunta == pregunta_sexo else ""
                pregunta_texto = f"- {nombre_pregunta}: {titulo} [Tipo: {tipo}]{es_pregunta_sexo}"

                # Procesar opciones de respuesta
                choices = element.get("choices", [])
                if choices:
                    opciones = []
                    for c in choices:
                        if isinstance(c, dict):
                            text = extraer_texto_html(c.get("text", ""))
                            opciones.append(text)
                        else:
                            opciones.append(str(c))

                    if opciones:
                        pregunta_texto += f"\n  Opciones: {', '.join(opciones)}"

                content.append(pregunta_texto)

        return "\n".join(content), parsed_body, pregunta_sexo

    except json.JSONDecodeError as e:
        logger.error(f"Error de formato JSON: {e}")
        return f"(Error al procesar JSON de la estructura: {e})\n", None, None
    except Exception as e:
        logger.error(f"Error inesperado procesando estructura: {e}")
        return f"(Error al procesar estructura: {e})\n", None, None

def cargar_documentos_metroscopicos(encuestas: List[Dict[str, Any]]) -> None:
    """
    Carga documentos de encuestas en un índice FAISS.

    Args:
        encuestas: Lista de diccionarios con información de encuestas
    """
    if not encuestas:
        logger.warning("No se recibieron encuestas para procesar")
        return

    # Crear directorio para el índice si no existe
    os.makedirs(INDEX_PATH.parent, exist_ok=True)

    documentos = []

    # Documento resumen
    resumen = Document(
        page_content=(
            f"Base de conocimiento de encuestas.\n"
            f"Contiene información sobre {len(encuestas)} encuestas diferentes.\n"
            f"Cada encuesta incluye su estructura de preguntas y las respuestas recibidas."
        ),
        metadata={"tipo": "resumen", "total_encuestas": len(encuestas)}
    )
    documentos.append(resumen)

    logger.info(f"Procesando {len(encuestas)} encuestas para FAISS")

    for i, encuesta in enumerate(encuestas):
        try:
            encuesta_id = encuesta.get("id")
            nombre = encuesta.get("name", "Sin nombre")
            body = encuesta.get("body", "{}")
            respuestas = encuesta.get("respuestas", [])

            logger.info(f"Procesando encuesta {i+1}/{len(encuestas)}: ID {encuesta_id}, Nombre: {nombre}")

            # Procesar estructura
            estructura_texto, parsed_body, pregunta_sexo = procesar_estructura_encuesta(body)

            # Analizar datos demográficos si se identificó la pregunta de sexo
            info_demografica = ""
            mujeres = 0
            hombres = 0

            if pregunta_sexo and respuestas:
                mujeres, hombres = contar_respuestas_por_genero(respuestas, pregunta_sexo)
                info_demografica = (
                    f"\nDATOS DEMOGRÁFICOS:\n"
                    f"- Total de participantes: {len(respuestas)}\n"
                    f"- Mujeres participantes: {mujeres}\n"
                    f"- Hombres participantes: {hombres}\n"
                )

            # Procesar respuestas
            respuestas_texto = "(No hay respuestas)\n"
            if respuestas:
                try:
                    respuestas_texto = json.dumps(respuestas, indent=2, ensure_ascii=False)
                except Exception as e:
                    logger.error(f"Error al serializar respuestas de encuesta ID {encuesta_id}: {e}")
                    respuestas_texto = f"(Error al procesar respuestas: {e})\n"

            # Crear contenido del documento
            content = (
                f"Encuesta: {nombre} (ID: {encuesta_id})\n\n"
                f"Estructura de la encuesta:\n{estructura_texto}\n\n"
                f"{info_demografica}"
                f"Respuestas recibidas ({len(respuestas) if isinstance(respuestas, list) else 'desconocido'}):\n{respuestas_texto}\n\n"
                f"Esta es una de las {len(encuestas)} encuestas en la base de conocimiento."
            )

            # Crear documento principal
            doc = Document(
                page_content=content,
                metadata={
                    "id": encuesta_id,
                    "nombre": nombre,
                    "indice": i+1,
                    "total": len(encuestas),
                    "num_respuestas": len(respuestas) if isinstance(respuestas, list) else 0,
                    "pregunta_sexo": pregunta_sexo,
                    "mujeres": mujeres,
                    "hombres": hombres
                }
            )
            documentos.append(doc)

            # Crear documento específico para información demográfica
            if pregunta_sexo and (mujeres > 0 or hombres > 0):
                demografico_doc = Document(
                    page_content=(
                        f"Información demográfica de la encuesta '{nombre}' (ID: {encuesta_id}):\n\n"
                        f"En esta encuesta participaron {len(respuestas)} personas en total.\n"
                        f"De ellas, {mujeres} participantes fueron mujeres.\n"
                        f"Y {hombres} participantes fueron hombres.\n\n"
                        f"La pregunta que identificaba el sexo/género era '{pregunta_sexo}'."
                    ),
                    metadata={
                        "id": encuesta_id,
                        "nombre": nombre,
                        "tipo": "demografico",
                        "mujeres": mujeres,
                        "hombres": hombres,
                        "total_participantes": len(respuestas)
                    }
                )
                documentos.append(demografico_doc)

        except Exception as e:
            logger.error(f"Error procesando encuesta {i+1}: {e}")
            # Continuar con la siguiente encuesta

    if not documentos:
        logger.error("No se generaron documentos para indexar")
        return

    try:
        # Crear índice
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        logger.info(f"Creando nuevo índice FAISS con {len(documentos)} documentos")
        db = FAISS.from_documents(documentos, embeddings)

        # Guardar índice
        db.save_local(str(INDEX_PATH))
        logger.info(f"Índice FAISS guardado en {INDEX_PATH}")
    except Exception as e:
        logger.error(f"Error al crear o guardar el índice FAISS: {e}")
        raise

