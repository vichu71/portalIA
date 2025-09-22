import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Silenciar warnings de Hugging Face
from transformers import logging as hf_logging
hf_logging.set_verbosity_error()

from app.services.classifier_utils import clasificar_pregunta
from ner_extract import extraer_entidades

preguntas = [
    "¿Qué puntuación sacó Juan Pérez?",
    "¿Cuál es la capital de Alemania?",
    "¿Cuántos tests se realizaron este año?",
    "Dame el historial de Lucía Fernández",
    "¿Qué módulos hay activos?",
    "Resultados de Pedro en liderazgo",
    "¿Qué es una red neuronal?",
    "¿Cuántos exámenes han sido completados?",
    "Muestra las habilidades de Ana Rodríguez",
    "¿Quién escribió Don Quijote?",
    "¿Cuántos encuestados de entre 45 y 54 años consideran que los partidos políticos españoles pueden resolver los principales problemas del país?",
    "¿Cuántos encuestados hay por rango de edad?",
    "¿Cuántas personas mayores de 60 años confían bastante o totalmente en los partidos políticos?"
]

print("🔍 Lanzando test de preguntas...\n")

for pregunta in preguntas:
    print(f"📥 Pregunta: {pregunta}")

    tipo = clasificar_pregunta(pregunta)
    etiquetas = {0: "general", 1: "dominio_sin_entidades", 2: "dominio_con_entidades"}
    print(f"🔎 Clasificación: {tipo} → {etiquetas.get(tipo)}")

    if tipo == 2:
        entidades = extraer_entidades(pregunta)
        for palabra, etiqueta, score in entidades:
            print(f"🔎 Entidad: {palabra} ({etiqueta}), conf: {score:.2f}")
    
    print("-" * 60)

