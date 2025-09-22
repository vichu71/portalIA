from transformers import AutoTokenizer, AutoModelForTokenClassification
from transformers import pipeline
import sys

MODEL_PATH = "/modelosIA/roberta-capitel-ner"

# Cargar tokenizer y modelo
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForTokenClassification.from_pretrained(MODEL_PATH)

# Pipeline NER con agregación
ner_pipeline = pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")

def extraer_entidades(texto):
    resultados = ner_pipeline(texto)
    return [(r['word'], r['entity_group'], r['score']) for r in resultados]

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 ner_extract.py 'Tu texto aquí'")
        sys.exit(1)
    texto = sys.argv[1]
    entidades = extraer_entidades(texto)
    print("Entidades encontradas:")
    for entidad in entidades:
        print(f"- {entidad[0]} ({entidad[1]}), confianza: {entidad[2]:.2f}")

