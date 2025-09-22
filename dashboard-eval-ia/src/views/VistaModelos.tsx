import React from 'react'
import ModelSelector from '../components/ModelSelector'
import PromptInput from '../components/PromptInput'
import MetricsPanel from '../components/MetricsPanel'

interface Props {
  selectedModel: string
  setSelectedModel: (m: string) => void
  onSubmitPrompt: (prompt: string) => void
  isProcessing: boolean
  metrics: {
    responseText: string
    responseTime: number
    tokensUsed: number
    cost: number
  }
}

const VistaModelos: React.FC<Props> = ({
  selectedModel,
  setSelectedModel,
  onSubmitPrompt,
  isProcessing,
  metrics,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      {/* Panel izquierdo */}
      <div className="space-y-6">
        <fieldset className="border rounded-xl p-4 shadow-sm">
          <legend className="text-sm font-medium text-gray-700">🧠 Consulta a modelos IA</legend>
          <ModelSelector selectedModel={selectedModel} onChange={setSelectedModel} />
          <PromptInput onSubmit={onSubmitPrompt} isProcessing={isProcessing} />
        </fieldset>

        <fieldset className="border rounded-xl p-4 shadow-sm">
          <legend className="text-sm font-medium text-gray-700">📈 Métricas</legend>
          <MetricsPanel metrics={metrics} />
        </fieldset>
      </div>

      {/* Panel derecho */}
      <div>
        <fieldset className="border rounded-xl p-4 shadow-sm h-full flex flex-col">
          <legend className="text-sm font-medium text-gray-700">📨 Respuesta generada</legend>
          <div className="bg-gray-100 text-sm p-4 rounded-md flex-1 whitespace-pre-wrap overflow-auto min-h-[200px]">
            {metrics.responseText || 'Esperando una consulta...'}
          </div>
        </fieldset>
      </div>
    </div>
  )
}

export default VistaModelos
