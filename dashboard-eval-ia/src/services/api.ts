import axios from 'axios';

const BASE_URL = 'http://localhost:8081';

export const askModel = async (model: string, prompt: string): Promise<string> => {
  let endpoint = '';

  switch (model) {
    case 'gpt-4':
      endpoint = `${BASE_URL}/api/openai`;
      break;
    case 'mistral-ollama':
      endpoint = `${BASE_URL}/api/ollama/mistral`;
      break;
    case 'deepseek-ollama':
      endpoint = `${BASE_URL}/api/ollama/deepseek`;
      break;
    case 'mistral-hugginface':
      endpoint = `${BASE_URL}/api/hugginface/mistral`;
      break;
    default:
      throw new Error(`Modelo desconocido: ${model}`);
  }

  const response = await axios.post(endpoint, { prompt });
  return response.data.text;
};

// 🧩 Funcionalidad de documentos

export const subirArchivos = async (files: FileList): Promise<string[]> => {
  const formData = new FormData();
  Array.from(files).forEach(file => formData.append('files', file));

  const response = await axios.post(`${BASE_URL}/api/documentos/subir`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data.archivos_subidos || [];
};

export const crearIndice = async (): Promise<string> => {
  const response = await axios.post(`${BASE_URL}/api/documentos/crear-indice`);
  return `${response.data.estado} con ${response.data.documentos_procesados} documentos.`;
};

export const estadoIndice = async (): Promise<{
  estado: string;
  documentos: number;
  ultima_modificacion?: string;
}> => {
  const response = await axios.get(`${BASE_URL}/api/documentos/estado-indice`);
  return response.data;
};

export const preguntarDocumentos = async (question: string): Promise<{
  respuesta: string;
  contexto_utilizado?: string[];
}> => {
  const response = await axios.post(`${BASE_URL}/api/documentos/preguntar`, { question });
  return response.data;
};

export const pingBackend = async (): Promise<"ok" | "error"> => {
  try {
    const res = await fetch(`${BASE_URL}/api/openai/ping`);
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
};

export const limpiarDocumentos = async (): Promise<string> => {
  const res = await axios.post(`${BASE_URL}/api/documentos/limpiar`);
  return res.data.mensaje || "Limpieza completada.";
};

export const preguntarDocumentosSimple = async (question: string): Promise<{
  respuesta: string;
  contexto_utilizado?: string[];
}> => {
  const response = await axios.post(`${BASE_URL}/api/documentos/preguntar-simple`, { question });
  return response.data;
};

export const listarDocumentos = async (): Promise<string[]> => {
  try {
    const res = await axios.get(`${BASE_URL}/api/documentos/listar`);
    console.log("Respuesta completa de la API:", res);
    
    // La API devuelve directamente un array, no un objeto con propiedad 'documentos'
    if (Array.isArray(res.data)) {
      // Si res.data es directamente un array, lo devolvemos
      return res.data;
    } 
    // Si es un objeto con propiedad 'documentos' (tu implementación original)
    else if (res.data && typeof res.data === 'object' && Array.isArray(res.data.documentos)) {
      return res.data.documentos;
    } 
    // Cualquier otro caso, intentamos extraer datos útiles o devolvemos array vacío
    else {
      console.warn("Formato de respuesta inesperado:", res.data);
      // Si es un objeto pero sin propiedad documentos, verificamos si tiene alguna propiedad que sea array
      if (res.data && typeof res.data === 'object') {
        for (const key in res.data) {
          if (Array.isArray(res.data[key])) {
            console.log(`Encontrada propiedad array "${key}" en la respuesta`);
            return res.data[key];
          }
        }
      }
      return []; // Fallback a array vacío
    }
  } catch (error) {
    console.error("Error en listarDocumentos:", error);
    throw error;
  }
};

export const eliminarDocumento = async (filename: string): Promise<void> => {
  await axios.delete(`${BASE_URL}/api/documentos/eliminar`, {
    data: { filename },
    headers: { 'Content-Type': 'application/json' }
  });
};
// 🖥️ Métricas GPU
export const obtenerMetricaGpu = async (): Promise<Array<{
  gpu_index: number,
  gpu_name: string,
  gpu_utilization: number,
  memory_total_mb: number,
  memory_used_mb: number
}>> => {
  const response = await axios.get(`${BASE_URL}/metrics/gpu`); // asegúrate de que coincida la ruta con tu backend real
  return response.data;
};



