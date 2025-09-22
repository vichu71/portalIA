# scripts/crear_faiss_index.py

import os
import json
import faiss
from sentence_transformers import SentenceTransformer
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)

# Rutas
DATASET_TIPO1 = "/home/cestel/IA_question/data/dataset_tipo1.jsonl"
DATASET_TIPO2 = "/home/cestel/IA_question/data/dataset_tipo2.jsonl"
DATASET_COMBINADO = "/home/cestel/IA_question/data/dataset_faiss.jsonl"
FAISS_INDEX_PATH = "/home/cestel/IA_question/index/faiss_index_st.bin"
MODEL_NAME = "all-mpnet-base-v2"

# Cargar datasets

def cargar_dataset(path):
    preguntas = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue  # Saltar líneas vacías
            try:
                data = json.loads(line)
                preguntas.append(data)
            except json.JSONDecodeError as e:
                logging.warning(f"❌ Línea inválida en {path}: {e}")
    return preguntas


def guardar_dataset_combinado(preguntas):
    with open(DATASET_COMBINADO, "w", encoding="utf-8") as f:
        for item in preguntas:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

def crear_faiss_index(dataset):
    model = SentenceTransformer(MODEL_NAME)
    prompts = [item["prompt"] for item in dataset]
    embeddings = model.encode(prompts, convert_to_tensor=False)

    dimension = embeddings[0].shape[0]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)

    faiss.write_index(index, FAISS_INDEX_PATH)
    logging.info(f"✅ Índice FAISS guardado en {FAISS_INDEX_PATH}")
    logging.info(f"🧠 Total de preguntas indexadas: {len(prompts)}")

if __name__ == "__main__":
    logging.info("📦 Unificando datasets...")
    preguntas_tipo1 = cargar_dataset(DATASET_TIPO1)
    preguntas_tipo2 = cargar_dataset(DATASET_TIPO2)
    dataset_completo = preguntas_tipo1 + preguntas_tipo2

    logging.info("💾 Guardando dataset combinado...")
    guardar_dataset_combinado(dataset_completo)

    logging.info("🔍 Generando índice FAISS...")
    crear_faiss_index(dataset_completo)

