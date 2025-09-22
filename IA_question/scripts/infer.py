from app.services.classifier_utils import clasificar_pregunta
import sys

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 infer.py 'Tu pregunta aquí'")
        sys.exit(1)

    pregunta = sys.argv[1]
    resultado = clasificar_pregunta(pregunta)
    etiquetas = {0: "general", 1: "dominio_sin_entidades", 2: "dominio_con_entidades"}
    print(f"Clasificación: {etiquetas.get(resultado, 'desconocido')}")

