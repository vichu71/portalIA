from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    AutoModelForTokenClassification,
    AutoConfig,
    pipeline
)
from app.services.utils import esquema_refuerzo_encuestas  # Importar el módulo de refuerzo de esquema

from peft import PeftModel, PeftConfig
import torch

# Rutas a modelos
CLASIFICADOR_PATH = "/modelosIA/classifier-finetuned"
NER_PATH = "/modelosIA/roberta-capitel-ner"

# Inicializar clasificador
def cargar_clasificador():
    config_peft = PeftConfig.from_pretrained(CLASIFICADOR_PATH)
    base_config = AutoConfig.from_pretrained(config_peft.base_model_name_or_path)
    base_config.num_labels = 3
    model = AutoModelForSequenceClassification.from_pretrained(
        config_peft.base_model_name_or_path, config=base_config
    )
    model = PeftModel.from_pretrained(model, CLASIFICADOR_PATH)
    tokenizer = AutoTokenizer.from_pretrained(CLASIFICADOR_PATH)
    return model, tokenizer

# Clasificar pregunta
def clasificar_pregunta(texto):
    model, tokenizer = cargar_clasificador()
    inputs = tokenizer(texto, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        logits = model(**inputs).logits
    clase_inicial = torch.argmax(logits, dim=1).item()
    # Aplicar capa de refuerzo por esquema de dominio y entidades
    clase_final = esquema_refuerzo_encuestas.reforzar_clasificacion(texto, clase_inicial)
    return clase_final
# Inicializar NER
def cargar_ner():
    tokenizer = AutoTokenizer.from_pretrained(NER_PATH)
    model = AutoModelForTokenClassification.from_pretrained(NER_PATH)
    return pipeline("ner", model=model, tokenizer=tokenizer, aggregation_strategy="simple")

# Extraer entidades
def extraer_entidades(texto):
    ner_pipeline = cargar_ner()
    resultados = ner_pipeline(texto)
    return [(r['word'], r['entity_group'], r['score']) for r in resultados]

