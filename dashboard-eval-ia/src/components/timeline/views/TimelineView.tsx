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
import TimelineControls from "./TimelineControls";
import TimelineHeader from "./TimelineHeader";
import TaskRow from "./TaskRow";
import TimelineStats from "./TimelineStats";
import TaskDetailsModal from "../../TaskDetailModal";

interface TimelineViewProps {
  isActive: boolean;
  onToastMessage: (message: string) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  isActive,
  onToastMessage,
}) => {
  // Hooks para manejar estado   
  const { tasks, projects, loading } = useTimelineData(isActive, onToastMessage);
  const { projectFilter, setProjectFilter } = useTimelineFilters();
  const { viewMode, setViewMode } = useTimelineViewMode();
  const { selectedTask, selectTask, clearSelection } = useSelectedTask();

  // Cálculos del timeline
  const { validTasks, dateRange, dailyGrid } = useTimelineCalculations(
    tasks,
    projectFilter,
    viewMode
  );

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

      {/* Timeline */}
      {validTasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No hay tareas con fechas válidas
          </h3>
          <p className="text-gray-500">
            Las tareas necesitan fecha de creación y fecha límite para aparecer
            en el timeline
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          {/* Header con fechas y cuadrícula */}
          <TimelineHeader
            dailyGrid={dailyGrid}
            dateRange={dateRange}
            viewMode={viewMode}
          />

          {/* Filas de tareas */}
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Leyenda actualizada con nuevo sistema de colores */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-800 mb-3 text-center">Estado de Tareas</h4>
        <div className="flex justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Completada ✅</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span>En progreso ⏰</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Atrasada 🚨</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Por comenzar 📅</span>
          </div>
        </div>
        
        {/* Leyenda secundaria para prioridades */}
        <div className="mt-4 pt-4 border-t border-gray-300">
          <h5 className="font-medium text-gray-700 mb-2 text-center text-xs">Prioridad (indicador pequeño)</h5>
          <div className="flex justify-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Alta</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Media</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Baja</span>
            </div>
          </div>
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