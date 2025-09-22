// components/CalendarLegend.tsx
import React from "react";

export const CalendarLegend: React.FC = () => {
  return (
    <div className="mt-6 space-y-3">
      <div className="flex justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-50 border-l-4 border-red-500 rounded"></div>
          <span className="text-sm text-gray-600">
            📝 Tarea creada ese día
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border-l-4 border-red-500 rounded"></div>
          <span className="text-sm text-gray-600">
            🎯 Tarea que vence (arrastrables)
          </span>
        </div>
      </div>
      <div className="flex justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            Tiene fecha de finalización
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-sm text-gray-600">
            Notas del día
          </span>
        </div>
      </div>
      <div className="text-center space-y-1">
        <span className="text-sm text-gray-500 italic">
          💡 Haz click en cualquier día para añadir notas
        </span>
        <br />
        <span className="text-sm font-medium text-blue-600">
          🖱️ Arrastra las tareas entre días para reprogramarlas
        </span>
      </div>
    </div>
  );
};