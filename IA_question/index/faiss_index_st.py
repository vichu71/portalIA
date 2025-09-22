import faiss
import numpy as np
import json
import logging
from sentence_transformers import SentenceTransformer

# Configuración
DATASET_PATH = "/home/cestel/datasets/dataset_faiss_entidades.jsonl"
FAISS_INDEX_PATH = "faiss_index_entidades.bin"  # Cambia el nombre para diferenciarlo del anterior

# Configurar logging
logging.basicConfig(level=logging.INFO)

# Cargar el modelo SentenceTransformer
logging.info("🔹 Cargando modelo SentenceTransformer...")
modelo = SentenceTransformer("all-MiniLM-L6-v2")  # 🏆 Mejor para búsqueda semántica
#modelo = SentenceTransformer("all-mpnet-base-v2")  # 🏆 Mejor para búsqueda semántica
logging.info("✅ Modelo SentenceTransformer cargado correctamente.")

# Cargar dataset de preguntas y respuestas
logging.info("🔹 Cargando dataset...")
dataset = []
try:
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            dataset.append(json.loads(line))
    logging.info(f"✅ Dataset cargado con {len(dataset)} preguntas.")
except Exception as e:
    logging.error(f"❌ Error cargando el dataset: {str(e)}")
    exit(1)

# Generar embeddings con SentenceTransformer
logging.info("🔹 Generando embeddings...")
preguntas = [entry["prompt"] for entry in dataset]
embeddings = modelo.encode(preguntas, convert_to_numpy=True)  # ✅ Correcto para ST
logging.info(f"✅ Embeddings generados con forma {embeddings.shape}.")

# Crear índice FAISS
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)  # Índice con distancia L2
index.add(embeddings)
logging.info(f"✅ Índice FAISS creado con {index.ntotal} embeddings.")

# Guardar el índice en un archivo
faiss.write_index(index, FAISS_INDEX_PATH)
logging.info(f"✅ Índice guardado en {FAISS_INDEX_PATH}.")

logging.info("🚀 FAISS listo para su uso con SentenceTransformer!")
