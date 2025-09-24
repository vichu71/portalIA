import React from "react";
import { Eye } from "lucide-react";
import { Task, Project, ViewMode, DateRange } from "../types/timeline";
import {
  getDayPosition,
  shouldShowDayLabel,
  getTaskBarStyle,
  getPriorityColor,
  getTaskStatusColor,
  getTaskStatusDescription,
  getStatusOpacity,
} from "../../../utils/timelineUtils";

interface TaskRowProps {
  task: Task;
  projects: Project[];
  dailyGrid: Date[];
  dateRange: DateRange;
  viewMode: ViewMode;
  onTaskClick: (task: Task) => void;
  onViewDetails: (task: Task) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  projects,
  dailyGrid,
  dateRange,
  viewMode,
  onTaskClick,
  onViewDetails,
}) => {
  const getProjectName = (projectId: number | undefined) => {
    if (!projectId) return "Sin proyecto";
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : `Proyecto #${projectId}`;
  };

  const taskBarStyle = getTaskBarStyle(task, dateRange, viewMode);

  return (
    <div className="flex border-b border-gray-100 hover:bg-gray-50">
      {/* Info de la tarea */}
      <div className="w-80 p-4 border-r">
        <div className="space-y-1">
          <div className="font-semibold text-gray-800 text-sm truncate">
            {task.title}
          </div>
          <div className="text-xs text-gray-600">
            {getProjectName(task.projectId)}
          </div>
          <div className="flex items-center gap-2">
            {/* Indicador de estado principal */}
            <span
              className={`w-3 h-3 rounded-full ${getTaskStatusColor(task).replace('bg-', 'bg-')}`}
              title={getTaskStatusDescription(task)}
            />
            
            {/* Indicador de prioridad más pequeño */}
            <span
              className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
              title={`Prioridad: ${task.priority}`}
            />
            
            {/* Estado descriptivo */}
            <span className="text-xs text-gray-600 font-medium">
              {getTaskStatusDescription(task)}
            </span>
            
            <button
              onClick={() => onViewDetails(task)}
              className="ml-auto p-1 hover:bg-gray-200 rounded"
              title="Ver detalles"
            >
              <Eye className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Área de barras con cuadrícula */}
      <div className="flex-1 relative h-20 overflow-hidden">
        {/* Líneas de cuadrícula de fondo */}
        <div className="absolute inset-0">
          {dailyGrid.map((day, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0"
              style={{
                left: `${getDayPosition(day, dateRange)}%`,
                borderLeft: shouldShowDayLabel(day, viewMode, dateRange)
                  ? "2px solid #D1D5DB"
                  : "1px solid #F3F4F6",
              }}
            />
          ))}
        </div>

        {/* Barra de tarea con nuevo sistema de colores */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:scale-105 transition-all z-10 ${getTaskStatusColor(
            task
          )} ${getStatusOpacity(
            task.status
          )} border-2 border-white relative`}
          style={taskBarStyle}
          onClick={() => onTaskClick(task)}
          title={`${task.title} - ${getTaskStatusDescription(task)} (${new Date(
            task.createdAt!
          ).toLocaleDateString()} - ${new Date(
            task.dueDate!
          ).toLocaleDateString()})`}
        >
          {/* Contenido principal de la barra */}
          <div className="h-full flex items-center px-2">
            <span className="text-white text-xs font-medium truncate">
              {task.title}
            </span>
          </div>
          
          {/* Indicador de prioridad en la esquina superior derecha */}
          <div
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(
              task.priority
            )} border border-white shadow-sm`}
            title={`Prioridad: ${task.priority}`}
          />
        </div>

        {/* Indicadores de fechas en los extremos */}
        <div
          className="absolute top-1 text-xs font-mono text-gray-600 bg-white px-1 py-0.5 rounded shadow-sm border z-20"
          style={{
            left: `${getDayPosition(new Date(task.createdAt!), dateRange)}%`,
          }}
        >
          {new Date(task.createdAt!).getDate()}/
          {new Date(task.createdAt!).getMonth() + 1}
        </div>
        <div
          className="absolute top-1 text-xs font-mono text-gray-600 bg-white px-1 py-0.5 rounded shadow-sm border z-20 transform -translate-x-full"
          style={{
            left: `${getDayPosition(new Date(task.dueDate!), dateRange)}%`,
          }}
        >
          {new Date(task.dueDate!).getDate()}/
          {new Date(task.dueDate!).getMonth() + 1}
        </div>
      </div>
    </div>
  );
};

export default TaskRow;