from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import os

app = Flask(__name__)

MODEL_PATH = "/modelosIA/Mistral-7B-Instruct-v0.3"

# Configurar dispositivo con soporte float16 y device_map automático
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.float16,
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

# Pipeline para generación de texto
text_generator = pipeline("text-generation", model=model, tokenizer=tokenizer)

@app.route("/responder_general", methods=["POST"])
def responder_general():
    data = request.get_json()
    pregunta = data.get("question")

    if not pregunta:
        return jsonify({"error": "Falta el campo 'question'"}), 400

    resultado = text_generator(pregunta, max_new_tokens=100, do_sample=False)[0]["generated_text"]

    return jsonify({"respuesta": resultado})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    app.run(host="0.0.0.0", port=port)

