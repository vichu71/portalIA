# 📦 Nombre del Proyecto
IA_question - Sistema de Inteligencia Artificial para Análisis de Encuestas

## 🧠 Descripción General

Sistema de inteligencia artificial que combina modelos de lenguaje con procesamiento inteligente de preguntas para generar consultas SQL en lenguaje natural y análisis de encuestas. El proyecto integra clasificación de preguntas, extracción de entidades (NER), búsqueda vectorial con FAISS y generación de respuestas usando modelos como Mistral y DeepSeek.

**Funcionalidades principales:**
- Clasificación automática de preguntas (general, dominio sin entidades, dominio con entidades)
- Extracción de entidades nombradas (personas, organizaciones, etc.)
- Búsqueda vectorial de consultas SQL similares
- Análisis inteligente de encuestas con datos demográficos
- API REST para integración con sistemas externos
- Procesamiento de documentos con LangChain

## 🧩 Dependencias de Otros Proyectos

- **Modelos IA externos:**
  - `/modelosIA/Mistral-7B-Instruct-v0.3`: Modelo de generación de texto
  - `/modelosIA/classifier-finetuned`: Clasificador BERT fine-tuned
  - `/modelosIA/roberta-capitel-ner`: Modelo NER para español
- **Servicios externos:**
  - Ollama (localhost:11434): Servicio para modelos Mistral y DeepSeek
  - CUDA 12.6: Para aceleración GPU

## 🔗 Proyectos que Dependen de Este

- **Question App**: Sistema principal de encuestas (Java)
- **BootChat**: Sistema de chat que consume las APIs
- **Monitor IA**: Sistema de monitoreo (`/home/cestel/monitor_ia/`)

## ⚙️ Tecnologías Principales

### Backend y APIs
- **Flask**: Framework web principal
- **LangChain**: Framework para aplicaciones LLM
- **PyTorch 2.6.0**: Framework de deep learning
- **TensorFlow 2.18.0**: Framework alternativo ML
- **Transformers**: Librería Hugging Face

### Procesamiento de Texto y ML
- **FAISS**: Búsqueda vectorial de alta velocidad
- **Sentence-Transformers**: Embeddings semánticos
- **PEFT**: Parameter-Efficient Fine-Tuning
- **Bitsandbytes**: Optimización de modelos

### Datos y Análisis
- **Pandas**: Manipulación de datos
- **NumPy**: Computación científica
- **Scikit-learn**: Machine learning tradicional

### Infraestructura
- **NVIDIA CUDA 12.6**: Aceleración GPU
- **Red Hat Enterprise Linux 8.10**: Sistema operativo
- **Systemd**: Gestión de servicios

## 📂 Estructura del Proyecto

```
IA_question/                          # Proyecto principal (1.2M total)
├── app/                             # Aplicación principal (224K)
│   ├── api/                         # APIs y servicios REST
│   │   ├── main_service.py          # Servicio principal (831 líneas) ⚡ ACTIVO
│   │   ├── mistral_general_service.py # Servicio Mistral (36 líneas)
│   │   ├── indices/                 # Índices FAISS locales
│   │   │   ├── index.faiss          # Índice vectorial
│   │   │   └── index.pkl            # Metadatos
│   │   └── *.log                    # Logs de Flask
│   └── services/                    # Lógica de negocio
│       ├── classifier_utils.py      # Clasificador + NER (50 líneas)
│       ├── faiss_utils.py          # Búsquedas FAISS (118 líneas)
│       ├── faiss_metroscopia.py    # Análisis encuestas (569 líneas)
│       ├── upload_indexer.py       # Indexación documentos (37 líneas)
│       └── utils/                  # Utilidades
│           ├── esquema_refuerzo.py          # Refuerzo clasificación (62 líneas)
│           └── esquema_refuerzo_encuestas.py # Refuerzo encuestas (114 líneas)
├── data/                           # Datasets de entrenamiento (164K)
│   ├── dataset_faiss.jsonl         # Dataset combinado FAISS (79K)
│   ├── dataset_tipo1.jsonl         # Preguntas sin entidades (45K)
│   └── dataset_tipo2.jsonl         # Preguntas con entidades (34K)
├── dataset/                        # Dataset original (48K)
│   └── dataset.jsonl              # Dataset base (45K)
├── index/                          # Índices principales (708K)
│   ├── faiss_index_st.bin         # Índice FAISS principal (703K)
│   └── faiss_index_st.py          # Script indexación (51 líneas)
├── scripts/                        # Scripts de utilidad (24K)
│   ├── crear_faiss_index.py       # Generación índices (65 líneas)
│   ├── test_batch.py              # Testing clasificación (43 líneas)
│   ├── infer.py                   # Inferencia directa (13 líneas)
│   └── ner_extract.py             # Extracción entidades (27 líneas)
├── uploads/                        # Documentos subidos (vacío)
├── indices/                        # Índices temporales (vacío)
├── model/                          # Modelos locales (vacío)
├── notebooks/                      # Jupyter notebooks (vacío)
├── outputs/                        # Resultados (vacío)
└── README.md                       # Documentación del proyecto
```

### Estadísticas del Código
- **Total archivos Python:** 16 archivos
- **Líneas de código total:** 2,016 líneas
- **Archivo principal:** `app/api/main_service.py` (831 líneas)
- **Servicio activo:** PID 377710 usando ambas GPUs

## 🚀 Despliegue

### Requisitos del Sistema
- **Red Hat Enterprise Linux 8.10+**
- **Python 3.11.11**
- **CUDA 12.6** (para aceleración GPU)
- **32+ GB RAM** (recomendado para modelos grandes)
- **Dual GPU NVIDIA** (RTX 4070 Ti SUPER o superior)

### Instalación

1. **Clonar y preparar entorno:**
```bash
cd /home/cestel/IA_question
pip install -r requirements.txt
```

2. **Verificar modelos IA:**
```bash
ls -la /modelosIA/
# Debe contener:
# - Mistral-7B-Instruct-v0.3/
# - classifier-finetuned/
# - roberta-capitel-ner/
```

3. **Configurar variables de entorno:**
```bash
export CUDA_HOME=/usr/local/cuda-12.6
export LD_LIBRARY_PATH=/usr/local/cuda-12.6/lib64:$LD_LIBRARY_PATH
```

4. **Inicializar índices FAISS:**
```bash
cd scripts/
python3 crear_faiss_index.py
```

### Arranque Manual
```bash
cd /home/cestel/IA_question
nohup python3 -m app.api.main_service > app/api/flask_main.log 2>&1 &
```

### Arranque como Servicio Systemd
```bash
# Crear archivo: /etc/systemd/system/question-ia.service
sudo systemctl daemon-reload
sudo systemctl start question-ia
sudo systemctl enable question-ia
```

### Verificación del Servicio
```bash
# Verificar proceso activo
ps aux | grep main_service.py

# Verificar GPUs en uso
nvidia-smi

# Verificar logs
tail -f app/api/flask_main.log
```

## 🧪 Cómo Probar

### Endpoints Principales

**Puerto:** 5000 (configurable con variable `PORT`)

#### 1. Clasificación de Preguntas
```bash
curl -X POST http://localhost:5000/clasificar \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Qué nota sacó Juan Pérez?"}'
```

#### 2. Respuesta General (Mistral)
```bash
curl -X POST http://localhost:5000/responder_general \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Qué es inteligencia artificial?"}'
```

#### 3. Búsqueda FAISS
```bash
curl -X POST http://localhost:5000/searchfaiss \
  -H "Content-Type: application/json" \
  -d '{"question": "usuarios activos"}'
```

#### 4. Análisis de Encuestas
```bash
curl -X POST http://localhost:5000/langchain/consultar_pregunta \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Cuántas mujeres participaron?",
    "encuestas": [...],
    "survey_id": "123"
  }'
```

#### 5. Gestión de Documentos
```bash
# Subir documentos
curl -X POST http://localhost:5000/subir_documentos \
  -F "files=@documento.pdf"

# Crear índice
curl -X POST http://localhost:5000/crear_indice

# Consultar documentos
curl -X POST http://localhost:5000/preguntar_documentos \
  -H "Content-Type: application/json" \
  -d '{"question": "Resume el contenido principal"}'
```

### Scripts de Testing
```bash
# Test de clasificación por lotes
cd scripts/
python3 test_batch.py

# Inferencia directa
python3 infer.py "¿Cuántos usuarios hay?"

# Extracción de entidades
python3 ner_extract.py "Juan Pérez trabaja en Madrid"
```

### Monitoring
```bash
# Ver estado del servicio
systemctl status question-ia

# Monitorear GPUs
watch -n 1 nvidia-smi

# Logs en tiempo real
tail -f app/api/flask_main.log
```

## 🧠 Entrada / Salida Esperada

### Clasificación de Preguntas

**Input:**
```json
{
  "question": "¿Qué puntuación sacó Juan Pérez en liderazgo?"
}
```

**Output:**
```json
{
  "tipo": 2,
  "entidades": [
    {
      "texto": "Juan Pérez",
      "tipo": "PER",
      "confianza": 0.98
    },
    {
      "texto": "liderazgo",
      "tipo": "MISC",
      "confianza": 0.85
    }
  ]
}
```

### Análisis de Encuestas

**Input:**
```json
{
  "question": "¿Cuántas mujeres participaron en la encuesta?",
  "encuestas": [
    {
      "id": "123",
      "name": "Encuesta Satisfacción 2025",
      "body": "...",
      "respuestas": [...]
    }
  ],
  "survey_id": "123"
}
```

**Output:**
```json
{
  "response": "En la encuesta 'Satisfacción 2025' han participado 45 mujeres de un total de 80 participantes.",
  "response_type": "report",
  "fuente": "ollama"
}
```

### Búsqueda FAISS

**Input:**
```json
{
  "question": "usuarios activos últimos 30 días"
}
```

**Output:**
```json
{
  "query": "SELECT COUNT(*) FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND status = 'active'",
  "similar_question": "¿Cuántos usuarios estuvieron activos el mes pasado?"
}
```

### Flujo del Sistema

1. **Pregunta General** (tipo 0) → Mistral/DeepSeek
2. **Pregunta de Dominio** (tipo 1) → FAISS + SQL
3. **Pregunta con Entidades** (tipo 2) → NER + FAISS + SQL personalizada

## 👨‍💻 Autor

**Víctor** - Ingeniero de IA  
**Fecha de creación:** Abril 2025  
**Última actualización:** Mayo 22, 2025

---

## 📊 Especificaciones del Hardware

### Sistema Operativo
- **Red Hat Enterprise Linux 8.10 (Ootpa)**
- **Kernel:** 4.18.0-553.50.1.el8_10.x86_64
- **Hostname:** TKLinux

### Procesador
- **Intel Core i7-14700** (14ª generación)
- **28 núcleos lógicos** (20 físicos + hyperthreading)
- **5.4 GHz máximo**, 2.1 GHz base

### Memoria y Almacenamiento
- **32 GB RAM DDR5** (25 GB disponibles)
- **SSD 1TB Kingston** (730 GB libres en root)
- **10 GB Swap**

### GPUs (Dual Setup)
- **2x NVIDIA GeForce RTX 4070 Ti SUPER**
- **32 GB VRAM total** (16 GB cada una)
- **CUDA 12.6** + **Driver 565.57.01**
- **Ambas GPUs activas** en el servicio principal

### Estado del Sistema
- **Servicio principal:** PID 377710 ⚡ ACTIVO
- **Monitor IA:** PID 1365 ⚡ ACTIVO  
- **Uso GPU:** Ambas tarjetas utilizadas
- **Uptime:** Desde abril 28, 2025