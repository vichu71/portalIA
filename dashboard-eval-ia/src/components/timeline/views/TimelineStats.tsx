import React from "react";
import { Task } from "../types/timeline";

interface TimelineStatsProps {
  tasks: Task[];
}

const TimelineStats: React.FC<TimelineStatsProps> = ({ tasks }) => {
  const stats = React.useMemo(() => {
    const now = new Date();
    
    const completed = tasks.filter(task => task.status === "completada").length;
    
    // Clasificar tareas por el nuevo sistema
    let beforeRange = 0;    // Azul - Aún no comenzadas
    let inRangeAssigned = 0; // Verde - En rango + asignadas
    let inRangeUnassigned = 0; // Amarillo - En rango + sin asignar
    let overdue = 0;        // Rojo - Atrasadas
    
    tasks.forEach(task => {
      if (task.status === "completada") return; // Ya contadas
      
      const startDate = new Date(task.startDate!);
      const dueDate = new Date(task.dueDate!);
      const isAssigned = !!(task.assignedTo);
      
      if (now > dueDate) {
        // Atrasada
        overdue++;
      } else if (now < startDate) {
        // Antes del rango
        beforeRange++;
      } else {
        // En el rango
        if (isAssigned) {
          inRangeAssigned++;
        } else {
          inRangeUnassigned++;
        }
      }
    });
    
    const total = tasks.length;
    const assigned = tasks.filter(task => !!(task.assignedTo)).length;
    const unassigned = total - assigned;
    
    return { 
      completed, 
      beforeRange, 
      inRangeAssigned, 
      inRangeUnassigned, 
      overdue, 
      total,
      assigned,
      unassigned
    };
  }, [tasks]);

  if (stats.total === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border p-4 mb-6">
      <h4 className="font-semibold text-gray-800 mb-3">📊 Resumen del Timeline</h4>
      
      {/* Estadísticas principales por estado temporal y asignación */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-green-700">Completadas ✅</div>
          <div className="text-xs text-green-600">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{stats.beforeRange}</div>
          <div className="text-xs text-blue-700">Por comenzar 📅</div>
          <div className="text-xs text-blue-600">
            {stats.total > 0 ? Math.round((stats.beforeRange / stats.total) * 100) : 0}%
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{stats.inRangeAssigned}</div>
          <div className="text-xs text-green-700">En progreso ✓</div>
          <div className="text-xs text-green-600">
            {stats.total > 0 ? Math.round((stats.inRangeAssigned / stats.total) * 100) : 0}%
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-xs text-red-700">Atrasadas 🚨</div>
          <div className="text-xs text-red-600">
            {stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Fila adicional para tareas sin asignar en rango */}
      {stats.inRangeUnassigned > 0 && (
        <div className="grid grid-cols-1 gap-4 text-center mb-4">
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-yellow-600">{stats.inRangeUnassigned}</div>
            <div className="text-xs text-yellow-700">Sin asignar (en rango) ⚠️</div>
            <div className="text-xs text-yellow-600">
              {stats.total > 0 ? Math.round((stats.inRangeUnassigned / stats.total) * 100) : 0}%
            </div>
          </div>
        </div>
      )}
      
      {/* Estadísticas de asignación */}
      <div className="grid grid-cols-2 gap-4 text-center mb-4">
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="text-lg font-bold text-emerald-600">{stats.assigned}</div>
          <div className="text-xs text-emerald-700">Tareas Asignadas 👤</div>
          <div className="text-xs text-emerald-600">
            {stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0}%
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-600">{stats.unassigned}</div>
          <div className="text-xs text-gray-700">Sin Asignar ❓</div>
          <div className="text-xs text-gray-600">
            {stats.total > 0 ? Math.round((stats.unassigned / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>
      
      {/* Barra de progreso visual actualizada */}
      <div className="mt-4">
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-200">
          {stats.completed > 0 && (
            <div 
              className="bg-green-600" 
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              title={`Completadas: ${stats.completed}`}
            />
          )}
          {stats.inRangeAssigned > 0 && (
            <div 
              className="bg-green-500" 
              style={{ width: `${(stats.inRangeAssigned / stats.total) * 100}%` }}
              title={`En progreso (asignadas): ${stats.inRangeAssigned}`}
            />
          )}
          {stats.inRangeUnassigned > 0 && (
            <div 
              className="bg-yellow-500" 
              style={{ width: `${(stats.inRangeUnassigned / stats.total) * 100}%` }}
              title={`En rango sin asignar: ${stats.inRangeUnassigned}`}
            />
          )}
          {stats.overdue > 0 && (
            <div 
              className="bg-red-500" 
              style={{ width: `${(stats.overdue / stats.total) * 100}%` }}
              title={`Atrasadas: ${stats.overdue}`}
            />
          )}
          {stats.beforeRange > 0 && (
            <div 
              className="bg-blue-500" 
              style={{ width: `${(stats.beforeRange / stats.total) * 100}%` }}
              title={`Por comenzar: ${stats.beforeRange}`}
            />
          )}
        </div>
      </div>
      
      {/* Texto explicativo del nuevo sistema */}
      <div className="mt-3 text-xs text-gray-600 text-center">
        <p>
          <strong>Sistema inteligente:</strong> Los colores combinan estado temporal y asignación •{" "}
          <strong>🟢 Verde:</strong> En su período + asignada •{" "}
          <strong>🟡 Amarillo:</strong> En su período pero sin asignar •{" "}
          <strong>🔴 Rojo:</strong> Atrasada •{" "}
          <strong>🔵 Azul:</strong> Aún no comenzada
        </p>
      </div>
    </div>
  );
};

export default TimelineStats;