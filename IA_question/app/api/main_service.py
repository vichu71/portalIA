from flask import request, jsonify, Flask
from app.services.upload_indexer import construir_indice
from langchain.chains import RetrievalQA,RetrievalQAWithSourcesChain
from langchain_community.llms import HuggingFacePipeline
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from app.services.classifier_utils import clasificar_pregunta, extraer_entidades
from app.services.faiss_utils import inicializar_faiss, buscar_sql_similar, buscar_sql_con_entidades
# Importar explícitamente las funciones que utilizamos
from app.services.faiss_metroscopia import (
    cargar_documentos_metroscopicos, 
    procesar_estructura_encuesta, 
    contar_respuestas_por_genero
)
from datetime import datetime
from pathlib import Path

import torch
import os
import requests
import logging
import json
import shutil

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"

inicializar_faiss()

# 📍 Config modelo Mistral para generación con LangChain
MODEL_PATH = "/modelosIA/Mistral-7B-Instruct-v0.3"
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH, torch_dtype=torch.float16, device_map="auto")
text_gen_pipeline = pipeline("text-generation", model=model, tokenizer=tokenizer, max_new_tokens=500, do_sample=False)
llm = HuggingFacePipeline(pipeline=text_gen_pipeline)

# Para mantener compatibilidad con el código que llama a text_generator
text_generator = text_gen_pipeline

#INDEX_PATH = "/home/cestel/IA_question/indices/faiss_metroscopico.index"
INDEX_PATH = "/home/cestel/IA_question/indices"


# Subida de ficheros para langchaing
UPLOAD_FOLDER = "/home/cestel/IA_question/uploads"
ALLOWED_EXTENSIONS = {"txt", "pdf", "docx", "md"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def limpiar_respuesta(texto: str) -> str:
    if "RESPUESTA:" in texto:
        return texto.split("RESPUESTA:")[-1].strip()
    if "Helpful Answer:" in texto:
        return texto.split("Helpful Answer:")[-1].strip()
    if "Correct Answer:" in texto:
        return texto.split("Correct Answer:")[-1].strip()
    return texto.strip()



def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/listar_documentos", methods=["GET"])
def listar_documentos():
    try:
        archivos = sorted([
            f.name for f in Path(UPLOAD_FOLDER).glob("*")
            if f.is_file()
        ])
        return jsonify({"documentos": archivos})
    except Exception as e:
        return jsonify({"error": f"Error al listar archivos: {str(e)}"}), 500



@app.route("/eliminar_documento", methods=["POST"])
def eliminar_documento():
    try:
        data = request.get_json()
        filename = data.get("filename")

        if not filename:
            return jsonify({"error": "Falta el campo 'filename'"}), 400

        ruta = os.path.join(UPLOAD_FOLDER, filename)

        if os.path.exists(ruta):
            os.remove(ruta)
            construir_indice()  # ⚙️ Regenerar el índice FAISS
            return jsonify({"mensaje": f"{filename} eliminado y FAISS actualizado correctamente."})
        else:
            return jsonify({"error": f"Archivo {filename} no encontrado."}), 404

    except Exception as e:
        return jsonify({"error": f"Error al eliminar archivo: {str(e)}"}), 500




@app.route("/limpiar_documentos", methods=["POST"])
def limpiar_documentos():
    try:
        for folder in [UPLOAD_FOLDER, INDEX_PATH]:
            for f in Path(folder).glob("*"):
                if f.is_file():
                    f.unlink()
                elif f.is_dir():
                    shutil.rmtree(f)
        return jsonify({"mensaje": "Documentos y FAISS eliminados correctamente."})
    except Exception as e:
        return jsonify({"error": f"Error al limpiar: {str(e)}"}), 500


from pathlib import Path

@app.route("/estado_indice", methods=["GET"])
def estado_indice():
    try:
        if not Path(INDEX_PATH).exists():
            return jsonify({
                "estado": "no creado",
                "documentos": 0
            })

        # Verifica si el archivo de índice existe
        faiss_file = Path(INDEX_PATH) / "index.faiss"
        if not faiss_file.exists():
            return jsonify({
                "estado": "vacío",
                "documentos": 0
            })

        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        num_docs = db.index.ntotal
        fecha = datetime.fromtimestamp(faiss_file.stat().st_mtime).isoformat()

        return jsonify({
            "estado": "activo",
            "documentos": num_docs,
            "ultima_modificacion": fecha
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

from pathlib import Path


@app.route("/preguntar_documentos_simple", methods=["POST"])
def preguntar_documentos_simple():
    try:
        data = request.get_json()
        pregunta = data.get("question")

        if not pregunta:
            return jsonify({"error": "Falta el campo 'question'"}), 400

        # Verificar que el índice exista
        from pathlib import Path
        faiss_file = Path(INDEX_PATH) / "index.faiss"
        if not faiss_file.exists():
            return jsonify({"error": "No hay índice cargado. Sube documentos y crea el índice antes de preguntar."}), 400

        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = db.as_retriever(search_kwargs={"k": 10})

        # Cadena de pregunta-respuesta
        from langchain.chains import RetrievalQA
        qa = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            return_source_documents=False
        )

        respuesta = limpiar_respuesta(qa.run(pregunta))

        return jsonify({
            "respuesta": respuesta
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error al generar respuesta: {str(e)}"}), 500





@app.route("/preguntar_documentos", methods=["POST"])
def preguntar_documentos():
    try:
        data = request.get_json()
        pregunta = data.get("question")

        if not pregunta:
            return jsonify({"error": "Falta el campo 'question'"}), 400

        # Verificar si existe el índice FAISS antes de cargarlo
        faiss_file = Path(INDEX_PATH) / "index.faiss"
        if not faiss_file.exists():
            return jsonify({"error": "No hay índice cargado. Sube documentos y crea el índice antes de preguntar."}), 400

        # Cargar el índice FAISS
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = db.as_retriever(search_kwargs={"k": 5})

        # Recuperar documentos relevantes
        documentos = retriever.get_relevant_documents(pregunta)
        fragmentos = [doc.page_content[:500] for doc in documentos]

        # Cadena de pregunta-respuesta
        qa = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            return_source_documents=False
        )
        respuesta = qa.run(pregunta)

        return jsonify({
            "respuesta": respuesta,
            "contexto_utilizado": fragmentos
        })

    except Exception as e:
        return jsonify({"error": f"Error al generar respuesta: {str(e)}"}), 500



@app.route("/crear_indice", methods=["POST"])
def crear_indice():
    try:
        num_docs = construir_indice()
        return jsonify({"estado": "índice creado", "documentos_procesados": num_docs})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/subir_documentos", methods=["POST"])
def subir_documentos():
    if 'files' not in request.files:
        return jsonify({"error": "No se encontraron archivos en la petición"}), 400

    archivos = request.files.getlist("files")
    guardados = []

    for archivo in archivos:
        if archivo and allowed_file(archivo.filename):
            ruta = os.path.join(UPLOAD_FOLDER, archivo.filename)
            archivo.save(ruta)
            guardados.append(archivo.filename)

    if not guardados:
        return jsonify({"error": "No se guardó ningún archivo válido"}), 400

    return jsonify({"archivos_subidos": guardados})


def limpiar_respuesta(respuesta_modelo: str) -> str:
    if "Correct Answer:" in respuesta_modelo:
        return respuesta_modelo.split("Correct Answer:")[1].strip().split("\n")[0]
    elif "Helpful Answer:" in respuesta_modelo:
        return respuesta_modelo.split("Helpful Answer:")[1].strip().split("\n")[0]
    else:
        return respuesta_modelo.strip()

@app.route("/responder_ollama_deepseek", methods=["POST"])
def responder_ollama_deepseek():
    try:
        data = request.get_json(force=True)
        pregunta = data.get("question")

        if not pregunta:
            return jsonify({"error": "Falta el campo 'question'"}), 400

        payload = {
            "model": "deepseek-r1",
            "prompt": pregunta,
            "stream": False
        }

        response = requests.post("http://localhost:11434/api/generate", json=payload)
        response.raise_for_status()

        json_response = response.json()
        respuesta = json_response.get("response", "Sin respuesta.")

        return jsonify({"respuesta": respuesta})

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error de red al contactar con DeepSeek: {e}")
        return jsonify({"error": f"Error de red: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"❌ Error general en /responder_deepseek: {e}")
        return jsonify({"error": f"Error inesperado: {str(e)}"}), 500



@app.route("/langchain/consultar_pregunta", methods=["POST"])
def consultar_pregunta():
    try:
        data = request.get_json()
        question = data.get("question")
        encuestas = data.get("encuestas", [])
        encuesta_id = data.get("survey_id")

        if not question or not encuestas:
            return jsonify({"error": "Faltan campos 'question' o 'encuestas'"}), 400

        logger.info(f"Recibida consulta: '{question}' con {len(encuestas)} encuestas")

        # Cargar documentos en FAISS
        cargar_documentos_metroscopicos(encuestas)
        logger.info("✅ Documentos cargados en FAISS para esta sesión.")

        # Configurar el retriever
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        db = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = db.as_retriever(search_kwargs={"k": 5})

        # 🔍 Detección automática de encuesta si no se pasó survey_id
        if not encuesta_id:
            resultado = retriever.get_relevant_documents(question)
            encuesta_nombre = resultado[0].metadata.get("nombre", "desconocida")
            encuesta_id = resultado[0].metadata.get("id", None)
            logger.info(f"🎯 Encuesta detectada automáticamente: {encuesta_nombre} (ID: {encuesta_id})")
            if encuesta_id:
                encuestas = [e for e in encuestas if str(e.get("id")) == str(encuesta_id)]

        if encuesta_id:
            logger.info(f"🔍 Filtrando encuesta seleccionada por ID: {encuesta_id}")
            encuestas = [e for e in encuestas if str(e.get("id")) == str(encuesta_id)]
            if not encuestas:
                return jsonify({
                    "response": "No se encontró la encuesta seleccionada.",
                    "response_type": "error"
                }), 404

        # Para la pregunta "cuántas encuestas hay", responder directamente
        if "cuantas" in question.lower() and "encuesta" in question.lower() and "hay" in question.lower():
            respuesta = f"Hay un total de {len(encuestas)} encuestas."
            return jsonify({
                "response": respuesta,
                "response_type": "report",
                "fuente": "directa"
            })

        # Obtener documentos relevantes para construir el contexto
        # Primero intentamos obtener documentos demográficos si la pregunta parece ser sobre género
        es_pregunta_demografica = any(palabra in question.lower() for palabra in 
                                   ["género", "genero", "sexo", "hombre", "mujer", 
                                    "femenino", "masculino", "distribución"])
        
        relevant_docs = []
        
        # Si es una pregunta demográfica, priorizamos documentos de tipo demográfico
        if es_pregunta_demografica:
            for doc in db.similarity_search(question, k=10):
                if doc.metadata.get("tipo") == "demografico":
                    relevant_docs.append(doc)
                    break
        
        # Complementamos con documentos generales si es necesario
        if len(relevant_docs) < 3:
            additional_docs = retriever.get_relevant_documents(question)
            for doc in additional_docs:
                if doc not in relevant_docs:
                    relevant_docs.append(doc)
                if len(relevant_docs) >= 5:
                    break
        
        # Construir el contexto con los documentos relevantes
        contexto = ""
        logger.info("📝 Contexto que se enviará al modelo:")
        for idx, doc in enumerate(relevant_docs):
            contenido_doc = doc.page_content[:1000] + "..." if len(doc.page_content) > 1000 else doc.page_content
            logger.info(f"📄 Documento {idx+1} (primeros 1000 caracteres):\n{contenido_doc}\n")
            contexto += f"--- DOCUMENTO {idx+1} ---\n{doc.page_content}\n\n"

        # Extraer información adicional de la encuesta actual
        encuesta_info = ""
        if encuestas and len(encuestas) == 1:
            encuesta = encuestas[0]
            nombre_encuesta = encuesta.get("name", "")
            
            # Intentar extraer datos de género directamente
            try:
                body = encuesta.get("body", "{}")
                respuestas = encuesta.get("respuestas", [])
                parsed_body = json.loads(body) if isinstance(body, str) else body
                
                # Buscar pregunta de género
                for page in parsed_body.get("pages", []):
                    for element in page.get("elements", []):
                        titulo = extraer_texto_html(element.get("title", "")).lower()
                        if "sexo" in titulo or "género" in titulo or "genero" in titulo:
                            encuesta_info += f"\nINFORMACIÓN IMPORTANTE: La pregunta sobre género o sexo en esta encuesta es '{element.get('name')}': {extraer_texto_html(element.get('title', ''))}.\n"
                            
                            # Extraer opciones
                            choices = element.get("choices", [])
                            if choices:
                                encuesta_info += "Las opciones son:\n"
                                for i, choice in enumerate(choices):
                                    if isinstance(choice, dict):
                                        value = choice.get("value", "")
                                        text = extraer_texto_html(choice.get("text", ""))
                                        encuesta_info += f"- {text} (valor en datos: {value})\n"
                                    else:
                                        encuesta_info += f"- {choice}\n"
                            break
            except Exception as e:
                logger.error(f"Error extrayendo información adicional: {e}")

        # Construir un prompt mejorado para el modelo
        prompt = f"""
        Eres un analista experto en encuestas. Tu tarea es responder a la siguiente pregunta basándote únicamente en los datos proporcionados.

        INSTRUCCIONES IMPORTANTES:
        1. En la estructura de la encuesta, cada pregunta tiene opciones identificadas como "Item 1", "Item 2", etc.
        2. En las respuestas, estos valores "Item X" corresponden a las opciones mostradas en la estructura.
        3. Por ejemplo, si ves "Pregunta2: ¿Cuál es tu sexo?" con opciones "Hombre, Mujer" y en las respuestas aparece "Pregunta2: Item 1", significa que esa persona seleccionó "Hombre".
        4. Proporciona respuestas exactas con números precisos y porcentajes cuando sea relevante.
        5. Si se te pregunta sobre distribución por género o sexo, busca específicamente la pregunta que lo identifica y cuenta cuántos hombres y mujeres hay.
        6. Si no encuentras la información necesaria, indica claramente que los datos no están disponibles.

        {encuesta_info}

        DATOS DE LA ENCUESTA:
        {contexto}

        PREGUNTA: {question}

        RESPUESTA (sé conciso y directo, proporcionando números exactos):
        """

        logger.info(f"❓ Pregunta del usuario: {question}")

        # Llamar a Ollama API con el prompt construido
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "temperature": 0.1,  # Reducir temperatura para respuestas más deterministas
        }

        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        respuesta = response.json().get("response", "")

        return jsonify({
            "response": respuesta,
            "response_type": "report",
            "fuente": "ollama"
        })

    except Exception as e:
        logger.error("❌ Error en /langchain/consultar_pregunta: %s", str(e))
        logger.exception("Detalles del error:")
        return jsonify({"error": str(e)}), 500


# @app.route("/langchain/consultar_pregunta", methods=["POST"])
# def consultar_pregunta():
#     try:
#         data = request.get_json()
#         question = data.get("question")
#         encuestas = data.get("encuestas", [])
#         encuesta_id = data.get("survey_id")

#         if not question or not encuestas:
#             return jsonify({"error": "Faltan campos 'question' o 'encuestas'"}), 400

#         logger.info(f"Recibida consulta: '{question}' con {len(encuestas)} encuestas")

#         # Detección de preguntas sobre género/demografía
#         es_pregunta_demografica = False
#         buscar_mujeres = False
#         buscar_hombres = False

#         if "mujeres" in question.lower() or "mujer" in question.lower() or "femenino" in question.lower():
#             es_pregunta_demografica = True
#             buscar_mujeres = True

#         if "hombres" in question.lower() or "hombre" in question.lower() or "masculino" in question.lower():
#             es_pregunta_demografica = True
#             buscar_hombres = True

#         # Cargar documentos en FAISS
#         cargar_documentos_metroscopicos(encuestas)
#         logger.info("✅ Documentos cargados en FAISS para esta sesión.")

#         # Configurar el retriever
#         embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
#         db = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
#         retriever = db.as_retriever(search_kwargs={"k": 5})

#         # 🔍 Detección automática de encuesta si no se pasó survey_id
#         encuesta_nombre = None
#         if not encuesta_id:
#             resultado = retriever.get_relevant_documents(question)
#             encuesta_nombre = resultado[0].metadata.get("nombre", "desconocida")
#             encuesta_id = resultado[0].metadata.get("id", None)
#             logger.info(f"🎯 Encuesta detectada automáticamente: {encuesta_nombre} (ID: {encuesta_id})")
#             if encuesta_id:
#                 encuestas = [e for e in encuestas if str(e.get("id")) == str(encuesta_id)]

#         if encuesta_id:
#             logger.info(f"🔍 Filtrando encuesta seleccionada por ID: {encuesta_id}")
#             encuestas = [e for e in encuestas if str(e.get("id")) == str(encuesta_id)]
#             if not encuestas:
#                 return jsonify({
#                     "response": "No se encontró la encuesta seleccionada.",
#                     "response_type": "error"
#                 }), 404

           
#             # Si es pregunta demográfica y tenemos una encuesta identificada
#             if es_pregunta_demografica and len(encuestas) == 1:
#                 encuesta = encuestas[0]
#                 nombre_encuesta = encuesta.get("name")
                
#                 # Usar la nueva función para obtener distribución por género
#                 distribucion = obtener_distribucion_genero(encuesta)
                
#                 if "error" not in distribucion:
#                     # Extraer datos para respuesta
#                     total = distribucion["total_respuestas"]
#                     conteos = distribucion["conteos"]
                    
#                     mujeres = 0
#                     hombres = 0
                    
#                     for texto, conteo in conteos.items():
#                         texto_lower = texto.lower()
#                         if "mujer" in texto_lower or "femenino" in texto_lower:
#                             mujeres += conteo
#                         elif "hombre" in texto_lower or "masculino" in texto_lower:
#                             hombres += conteo
                    
#                     if buscar_mujeres:
#                         respuesta = f"En la encuesta '{nombre_encuesta}' han participado {mujeres} mujeres de un total de {total} participantes."
#                     elif buscar_hombres:
#                         respuesta = f"En la encuesta '{nombre_encuesta}' han participado {hombres} hombres de un total de {total} participantes."
#                     else:
#                         respuesta = f"En la encuesta '{nombre_encuesta}' han participado {mujeres} mujeres y {hombres} hombres, de un total de {total} participantes."
                    
#                     logger.info(f"✅ Respuesta demográfica generada directamente: {respuesta}")
#                     logger.info(f"📊 Distribución completa: {conteos}")
                    
#                     return jsonify({
#                         "response": respuesta,
#                         "response_type": "report",
#                         "fuente": "análisis_demográfico"
#                     })

#         # Para la pregunta "cuántas encuestas hay"
#         if "cuantas" in question.lower() and "encuesta" in question.lower() and "hay" in question.lower():
#             prompt = f"""
#             Responde la siguiente pregunta basándote en la información proporcionada.
#             Hay exactamente {len(encuestas)} encuestas en total.

#             Pregunta: {question}
#             Respuesta:
#             """
#             resultado = text_gen_pipeline(prompt, max_new_tokens=100, do_sample=False)[0]["generated_text"]
#             respuesta = resultado.replace(prompt, "").strip()
#             return jsonify({
#                 "response": respuesta,
#                 "response_type": "report",
#                 "fuente": "directa"
#             })

#         # Para otras preguntas, usar RetrievalQA
#         qa = RetrievalQA.from_chain_type(
#             llm=llm,
#             retriever=retriever,
#             return_source_documents=False
#         )

#         # 🔎 Mostrar qué contexto le pasamos al modelo Mistral
#         logger.info("📝 Prompt enviado al modelo:")
#         logger.info(f"❓ Pregunta del usuario: {question}")
#         relevant_docs = retriever.get_relevant_documents(question)
#         for idx, doc in enumerate(relevant_docs):
#             logger.info(f"📄 Documento {idx+1} (primeros 1000 caracteres):\n{doc.page_content[:1000]}...\n")

#         # Para preguntas demográficas, construir un prompt personalizado
#         if es_pregunta_demografica:
#             contexto = ""
#             for doc in relevant_docs:
#                 contexto += f"{doc.page_content}\n\n"

#             prompt = f"""
#             Basándote ÚNICAMENTE en la siguiente información, responde a la pregunta sobre demografía.
#             Si la información contiene un número exacto de hombres o mujeres, utiliza ese número en tu respuesta.
#             Si no encuentras información específica, indica que no tienes datos suficientes.

#             INFORMACIÓN:
#             {contexto}

#             PREGUNTA: {question}

#             RESPUESTA:
#             """

#             respuesta = text_gen_pipeline(prompt, max_new_tokens=200, do_sample=False)[0]["generated_text"]
#             respuesta_limpia = respuesta.replace(prompt, "").strip()

#             return jsonify({
#                 "response": respuesta_limpia,
#                 "response_type": "report",
#                 "fuente": "demografía_asistida"
#             })
#         else:
#             # Para preguntas no demográficas, usar el flujo normal
#             respuesta_bruta = qa.run(question)
#             respuesta_limpia = limpiar_respuesta(respuesta_bruta)

#             return jsonify({
#                 "response": respuesta_limpia,
#                 "response_type": "report",
#                 "fuente": "retriever"
#             })

#     except Exception as e:
#         logger.error("❌ Error en /langchain/consultar_pregunta: %s", str(e))
#         logger.exception("Detalles del error:")
#         return jsonify({"error": str(e)}), 500
# 🚀 Clasificación
@app.route("/clasificar", methods=["POST"])
def clasificar():
    data = request.get_json()
    pregunta = data.get("question")

    if not pregunta:
        return jsonify({"error": "Falta el campo 'pregunta'"}), 400

    tipo = clasificar_pregunta(pregunta)
    respuesta = {"tipo": tipo}

    if tipo == 2:
        entidades = extraer_entidades(pregunta)
        respuesta["entidades"] = [
            {"texto": e[0], "tipo": e[1], "confianza": float(round(e[2], 2))}
            for e in entidades
        ]

    return jsonify(respuesta)

# 🧠 Respuesta con Mistral
@app.route("/responder_general", methods=["POST"])
def responder_general():
    data = request.get_json()
    pregunta = data.get("question")

    if not pregunta:
        return jsonify({"error": "Falta el campo 'question'"}), 400

    resultado = text_generator(pregunta, max_new_tokens=100, do_sample=False)[0]["generated_text"]
    return jsonify({"respuesta": resultado})


@app.route("/responder_ollama_mistral", methods=["POST"])
def responder_ollama_mistral():
    try:
        data = request.get_json(force=True)
        pregunta = data.get("question")

        if not pregunta:
            return jsonify({"error": "Falta el campo 'question'"}), 400

        payload = {
            "model": OLLAMA_MODEL,
            "prompt": pregunta,
            "stream": False
        }

        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()

        json_response = response.json()
        respuesta = json_response.get("response", "Sin respuesta.")

        return jsonify({"respuesta": respuesta})  # ← usa "respuesta" para ser consistente

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error al contactar con Ollama: {e}")
        return jsonify({"error": f"Error de red: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"❌ Error general: {e}")
        return jsonify({"error": f"Error inesperado: {str(e)}"}), 500




@app.route("/searchfaiss", methods=["POST"])
def searchfaiss():
    data = request.get_json()
    pregunta = data.get("question")

    if not pregunta:
        return jsonify({"error": "Falta la pregunta"}), 400

    try:
        sql, similar = buscar_sql_similar(pregunta)
        return jsonify({"query": sql, "similar_question": similar})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/searchfaiss_entities", methods=["POST"])
def searchfaiss_entities():
    data = request.get_json()
    pregunta = data.get("question")
    entidades = data.get("entidades", [])

    if not pregunta:
        return jsonify({"error": "Falta la pregunta"}), 400

    try:
        sql, similar = buscar_sql_con_entidades(pregunta, entidades)
        return jsonify({"query": sql, "similar_question": similar})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/mistral/informe_encuesta", methods=["POST"])
def informe_encuesta():
    try:
        data = request.get_json()
        logger.info(f"Petición recibida: {json.dumps(data, indent=2)}")

        prompt = data.get("prompt")
        reglas = data.get("reglas", "")
        encuesta = data.get("encuesta")
        respuestas = data.get("respuestas")

        logger.info(f"Parámetros recibidos: prompt={bool(prompt)}, reglas={bool(reglas)}, encuesta={bool(encuesta)}, respuestas={bool(respuestas)}")

        # Verificar qué campos específicos faltan
        campos_faltantes = []
        if not prompt:
            campos_faltantes.append("prompt")
        if not encuesta:
            campos_faltantes.append("encuesta")
        if not respuestas:
            campos_faltantes.append("respuestas")

        if campos_faltantes:
            logger.warning(f"Campos faltantes detectados: {campos_faltantes}")

        # Si falta algún campo pero tenemos al menos el prompt, podemos dar una respuesta genérica
        if campos_faltantes and prompt:
            if "encuesta" in campos_faltantes or "respuestas" in campos_faltantes:
                logger.info("Generando respuesta genérica con solo el prompt, SIN reglas")
                # Respuesta genérica usando SOLO el prompt sin las reglas
                texto = prompt  # Aquí ya no incluimos las reglas

                logger.info(f"Texto enviado al modelo (respuesta genérica):\n{texto[:200]}...")

                resultado = text_generator(
                    texto,
                    max_new_tokens=700,
                    do_sample=False,
                    truncation=True
                )[0]["generated_text"]

                respuesta_limpia = resultado.replace(texto, "").strip()

                logger.info(f"Respuesta generada (genérica, primeros 200 caracteres):\n{respuesta_limpia[:200]}...")

                respuesta = {
                    "respuesta": respuesta_limpia,
                    "advertencia": f"Respuesta genérica: Faltan datos de {', '.join(campos_faltantes)}"
                }

                logger.info(f"Devolviendo respuesta genérica con advertencia: {respuesta['advertencia']}")
                return jsonify(respuesta)

        # Si faltan campos y no podemos dar respuesta genérica
        elif campos_faltantes:
            error_msg = f"Faltan campos requeridos: {', '.join(campos_faltantes)}"
            logger.error(error_msg)
            return jsonify({"error": error_msg}), 400

        # Procesamiento normal cuando tenemos todos los campos
        texto = (
            f"{reglas}\n\n" if reglas else ""
            f"{prompt}\n\n"
            "📋 Estructura de la encuesta:\n"
            f"{encuesta}\n\n"
            "📊 Respuestas recogidas:\n"
            f"{respuestas}"
        )

        logger.info(f"Texto enviado al modelo (completo, primeros 200 caracteres):\n{texto[:200]}...")

        resultado = text_generator(
            texto,
            max_new_tokens=700,
            do_sample=False,
            truncation=True
        )[0]["generated_text"]

        respuesta_limpia = resultado.replace(texto, "").strip()

        logger.info(f"Respuesta generada (completa, primeros 200 caracteres):\n{respuesta_limpia[:200]}...")

        return jsonify({"respuesta": respuesta_limpia})
    except Exception as e:
        error_msg = f"Error al generar informe: {str(e)}"
        logger.error(f"Excepción: {error_msg}")
        logger.exception("Detalles del error:")
        return jsonify({"error": error_msg}), 500


# 🛠️ Arranque único
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

