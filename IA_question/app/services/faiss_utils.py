import faiss
import os
import json
import logging
from sentence_transformers import SentenceTransformer
import torch

logging.basicConfig(level=logging.INFO)

FAISS_INDEX_PATH = "/home/cestel/IA_question/index/faiss_index_st.bin"
FAISS_MODEL = "all-mpnet-base-v2"
DATASET_PATH = "/home/cestel/IA_question/data/dataset_faiss.jsonl"
modelo_faiss = None
index = None
preguntas = []
consultas_sql = {}

def inicializar_faiss():
    global modelo_faiss, index, preguntas, consultas_sql

    try:
        logging.info("🔹 Cargando modelo SentenceTransformer para FAISS...")
        modelo_faiss = SentenceTransformer(FAISS_MODEL)
        logging.info("✅ Modelo cargado correctamente.")
    except Exception as e:
        logging.error(f"❌ Error cargando modelo: {e}")
        exit(1)

    if not os.path.exists(FAISS_INDEX_PATH):
        logging.error(f"❌ El índice FAISS no existe en: {FAISS_INDEX_PATH}")
        exit(1)

    try:
        logging.info("🔹 Cargando índice FAISS...")
        index = faiss.read_index(FAISS_INDEX_PATH)
        logging.info(f"✅ Índice cargado con {index.ntotal} embeddings.")
    except Exception as e:
        logging.error(f"❌ Error al cargar índice FAISS: {e}")
        exit(1)

    if not os.path.exists(DATASET_PATH):
        logging.error(f"❌ Dataset no encontrado: {DATASET_PATH}")
        exit(1)


    try:
        with open(DATASET_PATH, "r", encoding="utf-8") as f:
            for i, line in enumerate(f, start=1):
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    if "prompt" in data and "response" in data:
                        preguntas.append(data["prompt"])
                        consultas_sql[data["prompt"]] = data["response"]
                except Exception as json_error:
                    logging.error(f"❌ JSON inválido en línea {i}: {line}")
                    logging.error(f"💥 Error: {json_error}")
        logging.info(f"✅ Dataset cargado con {len(preguntas)} preguntas.")
    except Exception as e:
        logging.error(f"❌ Error cargando el dataset: {str(e)}")
        exit(1)


def buscar_sql_similar(pregunta):
    try:
        embedding = modelo_faiss.encode(pregunta, convert_to_tensor=True, normalize_embeddings=True)
        embedding_np = embedding.cpu().detach().numpy().astype("float32")
        _, I = index.search(embedding_np.reshape(1, -1), k=1)

        idx = I[0][0]
        pregunta_similar = preguntas[idx]
        sql = consultas_sql.get(pregunta_similar, "Consulta no encontrada")

        logging.info(f"🔎 Pregunta similar: {pregunta_similar}")
        logging.info(f"📄 SQL: {sql}")

        return sql, pregunta_similar
    except Exception as e:
        logging.error(f"❌ Error en búsqueda FAISS: {e}")
        raise e

# En faiss_utils.py

def buscar_sql_con_entidades(pregunta, entidades):
    try:
        logging.info(f"🔍 Buscando en FAISS con entidades para: {pregunta}")
        logging.info(f"📎 Entidades recibidas: {entidades}")

        # 1. Embedding y búsqueda similar
        pregunta_embedding = modelo_faiss.encode(pregunta, convert_to_tensor=True)
        resultados = index.search(pregunta_embedding.cpu().detach().numpy().reshape(1, -1), k=1)

        idx_similar = resultados[1][0][0]
        pregunta_similar = preguntas[idx_similar]
        sql_base = consultas_sql[pregunta_similar]

        logging.info(f"✅ Pregunta más similar: {pregunta_similar}")
        logging.info(f"🧠 SQL base encontrada: {sql_base}")

        # 2. Sustituir tokens por entidades si están en la query
        sql_modificada = sql_base
        for entidad in entidades:
            texto = entidad.get("texto", "")
            tipo = entidad.get("tipo", "").lower()

            if f"${{{tipo}}}" in sql_modificada:
                sql_modificada = sql_modificada.replace(f"${{{tipo}}}", texto)
                logging.info(f"🔁 Sustituido: ${{{tipo}}} -> {texto}")

        logging.info(f"📦 SQL final generada: {sql_modificada}")
        return sql_modificada, pregunta_similar

    except Exception as e:
        logging.error(f"❌ Error en buscar_sql_con_entidades: {str(e)}")
        raise e

