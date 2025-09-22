from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import TextLoader, PyMuPDFLoader, UnstructuredFileLoader
from pathlib import Path

UPLOAD_FOLDER = "/home/cestel/IA_question/uploads"
INDEX_FOLDER = "/home/cestel/IA_question/indices"

def cargar_documentos():
    documentos = []
    for file in Path(UPLOAD_FOLDER).glob("*"):
        try:
            if file.suffix.lower() == ".pdf":
                loader = PyMuPDFLoader(str(file))
            elif file.suffix.lower() == ".docx":
                loader = UnstructuredFileLoader(str(file))
            else:
                loader = TextLoader(str(file), encoding="utf-8")

            loaded = loader.load()
            documentos.extend(loaded)
            print(f"✅ Cargado {file.name} con {len(loaded)} fragmentos")
        except Exception as e:
            print(f"⚠️ Error al cargar {file.name}: {e}")

    return documentos

def construir_indice():
    docs = cargar_documentos()
    if not docs:
        raise Exception("No se encontraron documentos válidos.")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = FAISS.from_documents(docs, embeddings)
    db.save_local(INDEX_FOLDER)
    print(f"✅ Índice FAISS guardado en {INDEX_FOLDER} con {len(docs)} documentos.")
    return len(docs)

