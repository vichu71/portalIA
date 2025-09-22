import React, { useState } from 'react'

interface PromptInputProps {
  onSubmit: (prompt: string) => void
  isProcessing: boolean
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isProcessing }) => {
  const [prompt, setPrompt] = useState('')

  const handleSend = () => {
    if (prompt.trim()) {
      onSubmit(prompt)
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        rows={6}
        placeholder="Escribe tu prompt aquí..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-4 text-sm border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        onClick={handleSend}
        disabled={isProcessing}
        className={`px-4 py-2 rounded-md text-white text-sm font-medium transition ${
          isProcessing
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isProcessing ? 'Enviando...' : 'Enviar Prompt'}
      </button>
    </div>
  )
}

export default PromptInput
