import React from 'react'

interface ModelSelectorProps {
  selectedModel: string
  onChange: (model: string) => void
}

const models = [
  { label: 'GPT-4 (OpenAI)', value: 'gpt-4' },
  { label: 'Mistral Ollama', value: 'mistral-ollama' },
  { label: 'DeepSeek Ollama', value: 'deepseek-ollama' },
  { label: 'Mistral Hugging Face', value: 'mistral-hugginface' },
  { label: 'FAISS (LangChain)', value: 'faiss-docs' },
]

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onChange }) => {
  return (
    <div className="mb-4">
      <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
        Selecciona un modelo:
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {models.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ModelSelector
