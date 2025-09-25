import React from "react";
import { Calendar } from "lucide-react";
import { Task, Project, ViewMode } from "../types/timeline";
import {
  useTimelineData,
  useTimelineFilters,
  useTimelineViewMode,
  useSelectedTask,
  useTimelineCalculations,
} from "../../../hooks/useTimeline";
import { useTimelineDrag } from "../../../hooks/useTimelineDrag";
import TimelineControls from "./TimelineControls";
import TimelineHeader from "./TimelineHeader";
import TaskRow from "./TimelineTaskRow";
import TimelineStats from "./TimelineStats";
import TaskDetailsModal from "../../TaskDetailModal";
import { updateTask } from "../../../services/taskService";

interface TimelineViewProps {
  isActive: boolean;
  onToastMessage: (message: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  isActive,
  onToastMessage,
}) => {
  // Hooks para manejar estado   
  const { tasks, projects, loading, refreshData } = useTimelineData(isActive, onToastMessage);
  const { projectFilter, setProjectFilter } = useTimelineFilters();
  const { viewMode, setViewMode } = useTimelineViewMode();
  const { selectedTask, selectTask, clearSelection } = useSelectedTask();

  // Cálculos del timeline
  const { validTasks, dateRange, dailyGrid } = useTimelineCalculations(
    tasks,
    projectFilter,
    viewMode
  );

  // Función para actualizar tarea - CONECTADA CON LA API REAL
  const handleTaskUpdate = async (task: Task, newStartDate: Date, newDueDate: Date) => {
    try {
      // 🔄 LLAMADA REAL A LA API usando updateTask del servicio
      await updateTask(task.id, { 
        startDate: newStartDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
        dueDate: newDueDate.toISOString().split('T')[0]       // Formato YYYY-MM-DD
      });
      
      // Recargar datos después de la actualización exitosa
      refreshData();

      onToastMessage(
        `✅ Tarea "${task.title}" actualizada: ${newStartDate.toLocaleDateString()} - ${newDueDate.toLocaleDateString()}`
      );

    } catch (error) {
      console.error('❌ Error actualizando tarea:', error);
      onToastMessage(`Error al actualizar la tarea: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Hook de drag & drop
  const {
    dragState,
    containerRef,
    handleDragStart,
    getHoverCursor,
    isDragActive,
  } = useTimelineDrag({
    dateRange,
    onTaskUpdate: handleTaskUpdate,
    onToastMessage,
  });

  const getProjectName = (projectId: number | undefined) => {
    if (!projectId) return "Sin proyecto";
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : `Proyecto #${projectId}`;
  };

  const handleTaskEdit = () => {
    clearSelection();
    onToastMessage("Para editar, ve a la sección de Tareas");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-600">Cargando timeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-center mb-8">
        <h3 className="text-4xl font-bold text-blue-700 text-center">
          📊 Timeline de Proyectos
          {isDragActive && (
            <span className="ml-3 text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded-full animate-pulse">
              🔄 Arrastrando...
            </span>
          )}
        </h3>
      </div>

      {/* Controles */}
      <TimelineControls
        projects={projects}
        projectFilter={projectFilter}
        onProjectFilterChange={setProjectFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Estadísticas del timeline */}
      <TimelineStats tasks={validTasks} />

      {/* Instrucciones de drag & drop */}
      <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✋</span>
          <div>
            <div className="font-semibold text-gray-800">🎯 Interacción Mejorada</div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Arrastra las barras</span> para cambiar fechas • 
              <span className="font-medium ml-2">Extremos</span> para redimensionar • 
              <span className="font-medium ml-2">Centro</span> para mover completa • 
              <span className="font-medium ml-2">ESC</span> para cancelar
            </div>
          </div>
          {isDragActive && (
            <div className="ml-auto">
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded animate-bounce">
                Suelta para confirmar
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {validTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No hay tareas con fechas válidas
          </h3>
          <p className="text-gray-500">
            Las tareas necesitan fecha de inicio y fecha límite para aparecer
            en el timeline
          </p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className={`bg-white rounded-xl shadow-md border overflow-hidden relative
            ${isDragActive ? 'ring-2 ring-blue-400 shadow-lg' : ''}
          `}
        >
          {/* Overlay durante drag para mejor UX */}
          {isDragActive && (
            <div className="absolute inset-0 bg-blue-50/30 z-30 pointer-events-none">
              <div className="absolute top-4 right-4 bg-blue-500 text-white text-sm px-3 py-2 rounded-lg shadow-lg">
                🎯 Arrastrando tarea • ESC para cancelar
              </div>
            </div>
          )}

          {/* Header con fechas y cuadrícula */}
          <TimelineHeader
            dailyGrid={dailyGrid}
            dateRange={dateRange}
            viewMode={viewMode}
          />

          {/* Filas de tareas con drag & drop */}
          <div className="max-h-96 overflow-y-auto">
            {validTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                projects={projects}
                dailyGrid={dailyGrid}
                dateRange={dateRange}
                viewMode={viewMode}
                onTaskClick={selectTask}
                onViewDetails={selectTask}
                dragState={dragState}
                onDragStart={handleDragStart}
                getHoverCursor={getHoverCursor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Leyenda actualizada con información de drag & drop */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border-2 border-blue-100">
        <h4 className="font-bold text-gray-800 mb-4 text-center text-lg">
          🎯 Sistema Inteligente de Colores + Drag & Drop
        </h4>
        
        {/* Colores principales del timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-blue-500 rounded-lg shadow-sm"></div>
              <span className="font-semibold text-blue-700">Por comenzar</span>
            </div>
            <p className="text-xs text-gray-600">
              📅 Aún no ha llegado la fecha de inicio
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-green-500 rounded-lg shadow-sm"></div>
              <span className="font-semibold text-green-700">En progreso</span>
            </div>
            <p className="text-xs text-gray-600">
              ✅ En su período + asignada a alguien
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-yellow-500 rounded-lg shadow-sm"></div>
              <span className="font-semibold text-yellow-700">Sin asignar</span>
            </div>
            <p className="text-xs text-gray-600">
              ⚠️ En su período pero nadie asignado
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-red-500 rounded-lg shadow-sm"></div>
              <span className="font-semibold text-red-700">Atrasada</span>
            </div>
            <p className="text-xs text-gray-600">
              🚨 Pasó su fecha límite sin completarse
            </p>
          </div>
        </div>
        
        {/* Nueva sección: Controles de Drag & Drop */}
        <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">✋</span>
            <span className="font-semibold text-purple-700 text-lg">Controles de Arrastrar y Soltar</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-purple-500 rounded cursor-grab"></span>
              <span><strong>Centro:</strong> Mover toda la tarea</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-purple-400 rounded cursor-col-resize"></span>
              <span><strong>Extremos:</strong> Cambiar fecha inicio/fin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-600">⌨️</span>
              <span><strong>ESC:</strong> Cancelar movimiento</span>
            </div>
          </div>
        </div>

        {/* Completadas */}
        <div className="bg-white rounded-lg p-4 border border-green-300 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 bg-green-600 rounded-lg shadow-sm"></div>
            <span className="font-semibold text-green-800">Completadas</span>
          </div>
          <p className="text-xs text-gray-600">
            🎉 Tareas marcadas como terminadas (verde más oscuro)
          </p>
        </div>
        
        {/* Indicadores adicionales */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h5 className="font-medium text-gray-700 mb-3 text-center">📍 Indicadores Adicionales</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Esquina izquierda: Asignada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>Esquina izquierda: Sin asignar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Esquina derecha: Prioridad alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Esquina derecha: Prioridad media</span>
            </div>
          </div>
        </div>
        
        {/* Explicación del sistema */}
        <div className="mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            <strong>🧠 Sistema Interactivo:</strong> Los colores te muestran el estado en tiempo real, 
            y ahora puedes <strong>arrastrar las barras para cambiar fechas visualmente</strong>. 
            ¡Gestión de proyectos nunca fue tan intuitiva! 🎯✨
          </p>
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          projectName={getProjectName(selectedTask.projectId)}
          onClose={clearSelection}
          onEdit={handleTaskEdit}
        />
      )}
    </div>
  );
};

export default TimelineView;