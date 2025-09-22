import React, { useEffect, useState } from 'react'
import FileUploader from '../components/FileUploader'
import PreguntaDocumentos from '../components/PreguntaDocumentos'
import { listarDocumentos, eliminarDocumento, obtenerMetricaGpu } from '../services/api'
import ConfirmModal from '../components/ConfirmModal'
import { Trash2 } from 'lucide-react'
import { Line, Doughnut } from 'react-chartjs-2'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'


// Registro de módulos de Chart.js
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement)

interface Props {
  archivosSubidos: string[]
  setArchivosSubidos: (files: string[]) => void
  handleCrearIndice: () => void
  handleLimpiar: () => void
  indiceReloadKey: number
}

interface GpuMetric {
  gpu_index: number
  gpu_name: string
  gpu_utilization: number
  gpu_temperature_celsius: number
  memory_total_mb: number
  memory_used_mb: number
  power_usage_watts: number
}

const VistaFaiss: React.FC<Props> = ({
  archivosSubidos,
  setArchivosSubidos,
  handleCrearIndice,
  handleLimpiar,
  indiceReloadKey,
}) => {
  const [documentos, setDocumentos] = useState<string[]>([])
  const [cargando, setCargando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [documentoAEliminar, setDocumentoAEliminar] = useState<string | null>(null)
  const [monitorActivo, setMonitorActivo] = useState<boolean>(false);
  const [gpuMetrics, setGpuMetrics] = useState<GpuMetric[]>([])
  
  const [gpuMemoryHistories, setGpuMemoryHistories] = useState<{
    [gpuIndex: number]: { labels: string[], data: number[] }
  }>({})
const handleInicioConsultaIA = () => {
  setMonitorActivo(true);
};

const handleFinConsultaIA = () => {
  setTimeout(() => setMonitorActivo(false), 5000);
};
  const cargarDocumentos = () => {
    setCargando(true)
    setError(null)

    listarDocumentos()
      .then((res) => {
        if (Array.isArray(res)) {
          setDocumentos(res)
        } else {
          console.warn("⚠️ La respuesta no es un array:", res)
          setDocumentos([])
          setError("Formato de respuesta invalido")
        }
      })
      .catch((err) => {
        console.error("❌ Error al cargar documentos:", err)
        setError(`Error: ${err?.message || 'Desconocido'}`)
      })
      .finally(() => {
        setCargando(false)
      })
  }

  useEffect(() => {
    cargarDocumentos()
  }, [indiceReloadKey])

  useEffect(() => {
  if (!monitorActivo) return;

  const interval = setInterval(() => {
    obtenerMetricaGpu()
      .then((data) => {
        const timestamp = new Date().toLocaleTimeString();
        setGpuMemoryHistories((prev) => {
          const updated = { ...prev };
          data.forEach((gpu: any) => {
            const history = updated[gpu.gpu_index] || { labels: [], data: [] };
            const newLabels = [...history.labels, timestamp].slice(-10);
            const newData = [...history.data, gpu.memory_used_mb].slice(-10);
            updated[gpu.gpu_index] = { labels: newLabels, data: newData };
          });
          return updated;
        });

        const gpuData: GpuMetric[] = data.map((gpu: any) => ({
          gpu_index: gpu.gpu_index,
          gpu_name: gpu.gpu_name,
          gpu_utilization: gpu.gpu_utilization,
          memory_total_mb: gpu.memory_total_mb,
          memory_used_mb: gpu.memory_used_mb,
          gpu_temperature_celsius: gpu.gpu_temperature_celsius ?? -1,
          power_usage_watts: gpu.power_usage_watts ?? -1,
        }));
        setGpuMetrics(gpuData);
      })
      .catch((err) => console.error(err));
  }, 1000);

  return () => clearInterval(interval);
}, [monitorActivo]);


  const confirmarEliminacion = (filename: string) => {
    setDocumentoAEliminar(filename)
    setModalAbierto(true)
  }

  const ejecutarEliminacion = async () => {
    if (!documentoAEliminar) return
    try {
      await eliminarDocumento(documentoAEliminar)
      setMensaje(`✅ Documento "${documentoAEliminar}" eliminado correctamente`)
      setDocumentos(prev => prev.filter(doc => doc !== documentoAEliminar))
    } catch (err) {
      console.error("❌ Error al eliminar documento:", err)
      setMensaje(`❌ Error al eliminar "${documentoAEliminar}"`)
    } finally {
      setModalAbierto(false)
      setDocumentoAEliminar(null)
      setTimeout(() => setMensaje(null), 3000)
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* Zona de gestión de documentos */}
      <fieldset className="border rounded-xl p-4 shadow-sm">
        <legend className="text-sm font-semibold text-gray-700">📁 Gestión de Documentos FAISS</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div className="border border-gray-200 rounded p-3 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">📤 Subir archivos</h4>
            <FileUploader onUploadSuccess={setArchivosSubidos} />

            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                Archivos subidos:{" "}
                {archivosSubidos.length > 0 ? (
                  <span className="font-medium">{archivosSubidos.join(", ")}</span>
                ) : (
                  <span className="italic text-gray-400">ninguno</span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCrearIndice}
                  disabled={archivosSubidos.length === 0}
                  className={`px-3 py-1 rounded-md text-sm transition ${
                    archivosSubidos.length === 0
                      ? "bg-blue-300 cursor-not-allowed text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  🧠 Crear índice FAISS
                </button>
                {/* <button
                  onClick={handleLimpiar}
                  disabled={archivosSubidos.length === 0}
                  className={`px-3 py-1 rounded-md text-sm transition ${
                    archivosSubidos.length === 0
                      ? "bg-red-300 cursor-not-allowed text-white"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  
                  🧹 Limpiar documentos
                </button> */}
                <button
  onClick={handleLimpiar}
  className="px-3 py-1 rounded-md text-sm transition bg-red-600 text-white hover:bg-red-700"
>
  🧹 Limpiar documentos
</button>

              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-3 bg-gray-50 max-h-72 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">📄 Archivos en FAISS</h4>
            {error ? (
              <p className="text-sm italic text-red-500">{error}</p>
            ) : cargando ? (
              <p className="text-sm italic text-gray-500">Cargando documentos...</p>
            ) : documentos.length === 0 ? (
              <p className="text-sm italic text-gray-500">No hay documentos cargados aún.</p>
            ) : (
              <ul className="text-sm text-gray-800 space-y-1">
                {documentos.map((doc, index) => (
                  <li key={index} className="flex justify-between items-center truncate w-full">
                    <span className="truncate">{doc}</span>
                    <button
                      onClick={() => confirmarEliminacion(doc)}
                      className="ml-2 text-red-600 hover:text-red-800"
                      title="Eliminar documento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </fieldset>

      {/* Gráficos y métricas por GPU */}
      <fieldset className="border rounded-xl p-4 shadow-sm">
        <legend className="text-sm font-semibold text-gray-700">📊 Monitor dinámico de GPUs</legend>
        <div className="flex justify-end mb-2">
  <button
    onClick={() => setMonitorActivo(!monitorActivo)}
    className={`px-3 py-1 rounded text-xs font-semibold transition ${
      monitorActivo
        ? "bg-red-600 text-white hover:bg-red-700"
        : "bg-green-600 text-white hover:bg-green-700"
    }`}
  >
    {monitorActivo ? "⏸️ Parar monitorización" : "▶️ Iniciar monitorización"}
  </button>
</div>

        {gpuMetrics.length === 0 ? (
          <p className="text-sm italic text-gray-500">Cargando métricas de GPU...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gpuMetrics.map((gpu) => {
              const porcentajeUso = gpu.gpu_utilization
const porcentajeUsoMemoria = (gpu.memory_used_mb / gpu.memory_total_mb) * 100;
const colorLinea = porcentajeUsoMemoria >= 80 ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 99, 132, 0.5)';
const bordeColor = porcentajeUsoMemoria >= 80 ? 'rgb(255, 0, 0)' : 'rgb(255, 99, 132)';


              return (
                <div key={gpu.gpu_index} className="border p-3 rounded shadow bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">{gpu.gpu_name}</h4>

                  {/* Gráfico de línea */}
                  <div className="h-40 mb-4">
                    <Line
  data={{
    labels: gpuMemoryHistories[gpu.gpu_index]?.labels || [''],
    datasets: [{
      label: 'Memoria usada (MB)',
      data: gpuMemoryHistories[gpu.gpu_index]?.data || [0],
      borderColor: bordeColor,
      backgroundColor: colorLinea,
    }],
  }}
/>

                  </div>

                  {/* Gráfico de tarta dinámico */}
                  <div className="h-40 w-40 mx-auto mb-4">
                    <Doughnut
                      data={{
                        labels: ['Usada (%)', 'Libre (%)'],
                        datasets: [{
                          data: [porcentajeUso, 100 - porcentajeUso],
                          backgroundColor: ['rgb(255, 99, 132)', 'rgb(229, 231, 235)'],
                        }],
                      }}
                      options={{
                        cutout: '70%',
                        plugins: { legend: { display: true } },
                      }}
                    />
                  </div>

                  <ul className="text-xs text-gray-600 space-y-1 mt-2">
                    <li>🧊 Temp.: {gpu.gpu_temperature_celsius} °C</li>
                    <li>⚡ Utilización: {gpu.gpu_utilization} %</li>
                    <li>💾 Memoria usada: {gpu.memory_used_mb} MB</li>
                    <li>💿 Memoria total: {gpu.memory_total_mb} MB</li>
                    <li>🔋 Potencia: {gpu.power_usage_watts} W</li>
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </fieldset>

<fieldset className="border rounded-xl p-6 shadow-lg bg-white">
  <legend className="text-base font-semibold text-gray-800 mb-4">🤖 Consulta con IA sobre documentos</legend>
  <PreguntaDocumentos
    onStart={handleInicioConsultaIA}
    onEnd={handleFinConsultaIA}
  />
</fieldset>

      <ConfirmModal
        open={modalAbierto}
        title="¿Eliminar documento?"
        message={`¿Estás seguro de que quieres eliminar "${documentoAEliminar}"?`}
        onCancel={() => {
          setModalAbierto(false)
          setDocumentoAEliminar(null)
        }}
        onConfirm={ejecutarEliminacion}
      />
    </div>
  )
}

export default VistaFaiss
