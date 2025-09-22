import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Metrics {
  responseText: string
  responseTime: number
  tokensUsed: number
  cost: number
}

interface MetricsPanelProps {
  metrics: Metrics
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const chartData = [
    { name: 'Tiempo (ms)', value: metrics.responseTime },
    { name: 'Tokens', value: metrics.tokensUsed },
    { name: 'Coste (USD)', value: metrics.cost },
  ]

  return (
    <div className="space-y-6">
      {/* Datos en lista */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">📊 Datos numéricos</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            ⏱️ <span className="font-medium">Tiempo de respuesta:</span> {metrics.responseTime} ms
          </li>
          <li>
            🔢 <span className="font-medium">Tokens usados:</span> {metrics.tokensUsed}
          </li>
          <li>
            💰 <span className="font-medium">Coste estimado:</span> {metrics.cost.toFixed(4)} USD
          </li>
        </ul>
      </div>

      {/* Gráfico */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">📈 Gráfico resumen</h4>
        <div className="h-60 bg-white rounded-lg shadow border p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default MetricsPanel
