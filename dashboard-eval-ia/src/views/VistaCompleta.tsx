import React from 'react'
import ModelSelector from '../components/ModelSelector'
import PromptInput from '../components/PromptInput'
import MetricsPanel from '../components/MetricsPanel'
import FileUploader from '../components/FileUploader'
import IndiceStatus from '../components/IndiceStatus'
import PreguntaDocumentos from '../components/PreguntaDocumentos'

interface Props {
  selectedModel: string
  setSelectedModel: (m: string) => void
  onSubmitPrompt: (prompt: string) => void
  isProcessing: boolean
  archivosSubidos: string[]
  setArchivosSubidos: (files: string[]) => void
  handleCrearIndice: () => void
  handleLimpiar: () => void
  indiceReloadKey: number
  metrics: { responseText: string; responseTime: number; tokensUsed: number; cost: number }
}

const VistaCompleta: React.FC<Props> = ({
  selectedModel,
  setSelectedModel,
  onSubmitPrompt,
  isProcessing,
  archivosSubidos,
  setArchivosSubidos,
  handleCrearIndice,
  handleLimpiar,
  indiceReloadKey,
  metrics,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      {/* Columna izquierda */}
      <div className="space-y-6">
        {/* Consulta a modelos */}
        <fieldset className="border rounded-xl p-4 shadow-sm">
          <legend className="text-sm font-semibold text-gray-700">🧠 Consulta a modelos IA</legend>
          <ModelSelector selectedModel={selectedModel} onChange={setSelectedModel} />
          <PromptInput onSubmit={onSubmitPrompt} isProcessing={isProcessing} />
        </fieldset>

        {/* Subida de documentos */}
        <fieldset className="border rounded-xl p-4 shadow-sm">
          <legend className="text-sm font-semibold text-gray-700">📁 Documentos</legend>
          <FileUploader onUploadSuccess={setArchivosSubidos} />
          {archivosSubidos.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-sm text-gray-600">Archivos subidos: <span className="font-medium">{archivosSubidos.join(', ')}</span></p>
              <div className="flex gap-2">
                <button
                  onClick={handleCrearIndice}
                  className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                >
                  🧠 Crear índice FAISS
                </button>
                <button
                  onClick={handleLimpiar}
                  className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 transition"
                >
                  🧹 Limpiar documentos
                </button>
              </div>
            </div>
          )}
          <IndiceStatus reloadKey={indiceReloadKey} />
        </fieldset>

        {/* Métricas */}
        <fieldset className="border rounded-xl p-4 shadow-sm">
          <legend className="text-sm font-semibold text-gray-700">📈 Métricas</legend>
          <MetricsPanel metrics={metrics} />
        </fieldset>

        {/* Consulta FAISS */}
        <fieldset className="border rounded-xl p-4 shadow-sm">
          <legend className="text-sm font-semibold text-gray-700">📚 Consulta sobre documentos FAISS</legend>
          <PreguntaDocumentos />
        </fieldset>
      </div>

      {/* Columna derecha: respuesta generada */}
      <div>
        <fieldset className="border rounded-xl p-4 shadow-sm h-full flex flex-col">
          <legend className="text-sm font-semibold text-gray-700">📨 Respuesta generada</legend>
          <div className="bg-gray-100 text-sm p-4 rounded-md flex-1 whitespace-pre-wrap overflow-auto min-h-[200px]">
            {metrics.responseText || 'Esperando una consulta...'}
          </div>
        </fieldset>
      </div>
    </div>
  )
}

export default VistaCompleta
