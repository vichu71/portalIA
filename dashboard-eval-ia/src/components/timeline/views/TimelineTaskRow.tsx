import React, { useRef, useState } from "react";
import { Eye } from "lucide-react";
import { Task, Project, ViewMode, DateRange, DragState } from "../types/timeline";
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
  // Drag & Drop props
  dragState: DragState;
  onDragStart: (event: React.MouseEvent, task: Task, barElement: HTMLElement) => void;
  getHoverCursor: (mouseX: number, barRect: DOMRect) => string;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  projects,
  dailyGrid,
  dateRange,
  viewMode,
  onTaskClick,
  onViewDetails,
  dragState,
  onDragStart,
  getHoverCursor,
}) => {
  const taskBarRef = useRef<HTMLDivElement>(null);
  const [hoverCursor, setHoverCursor] = useState<string>('pointer');

  const getProjectName = (projectId: number | undefined) => {
    if (!projectId) return "Sin proyecto";
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : `Proyecto #${projectId}`;
  };

  const isAssigned = !!(task.assignedTo);
  const assignedTo = task.assignedTo || "Sin asignar";

  // Determinar si esta tarea está siendo arrastrada
  const isBeingDragged = dragState.isDragging && dragState.draggedTask?.id === task.id;
  
  // Usar fechas de preview si está siendo arrastrada
  const displayStartDate = isBeingDragged && dragState.previewStartDate 
    ? dragState.previewStartDate 
    : new Date(task.startDate!);
  const displayDueDate = isBeingDragged && dragState.previewDueDate 
    ? dragState.previewDueDate 
    : new Date(task.dueDate!);

  // Calcular estilo de barra (usando fechas de display)
  const taskBarStyle = (() => {
    if (isBeingDragged && dragState.previewStartDate && dragState.previewDueDate) {
      // Calcular estilo con fechas de preview
      const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
      const taskStartTime = dragState.previewStartDate.getTime();
      const taskEndTime = dragState.previewDueDate.getTime();
      const taskDuration = taskEndTime - taskStartTime;
      
      const leftPercent = ((taskStartTime - dateRange.start.getTime()) / totalDuration) * 100;
      const baseWidthPercent = (taskDuration / totalDuration) * 100;
      
      return {
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.max(2, Math.min(100, baseWidthPercent))}%`,
      };
    }
    return getTaskBarStyle(task, dateRange, viewMode);
  })();

  const handleMouseMove = (event: React.MouseEvent) => {
    if (taskBarRef.current && !dragState.isDragging) {
      const barRect = taskBarRef.current.getBoundingClientRect();
      const cursor = getHoverCursor(event.clientX, barRect);
      setHoverCursor(cursor);
    }
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (taskBarRef.current) {
      onDragStart(event, task, taskBarRef.current);
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    // Solo hacer click si no estamos arrastrando
    if (!dragState.isDragging) {
      onTaskClick(task);
    }
  };

  return (
    <div className="flex border-b border-gray-100 hover:bg-gray-50">
      {/* Info de la tarea */}
      <div className="w-80 p-4 border-r">
        <div className="space-y-1">
          <div className="font-semibold text-gray-800 text-sm truncate">
            {task.title}
            {isBeingDragged && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                Moviendo...
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600">
            {getProjectName(task.projectId)}
          </div>
          
          {/* Nueva información de asignación */}
          <div className="flex items-center gap-2">
            {/* Indicador de asignación principal */}
            <span
              className={`w-3 h-3 rounded-full ${
                isAssigned ? "bg-green-500" : "bg-gray-400"
              }`}
              title={`Asignación: ${assignedTo}`}
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
          
          {/* Información adicional de asignación */}
          <div className="text-xs text-gray-500 truncate">
            👤 {assignedTo}
          </div>

          {/* Preview de fechas durante drag */}
          {isBeingDragged && (
            <div className="text-xs bg-amber-50 text-amber-700 p-2 rounded border border-amber-200">
              <div className="font-medium">📅 Nuevas fechas:</div>
              <div>Inicio: {displayStartDate.toLocaleDateString()}</div>
              <div>Fin: {displayDueDate.toLocaleDateString()}</div>
            </div>
          )}
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

        {/* Barra de tarea con drag & drop */}
        <div
          ref={taskBarRef}
          className={`absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg shadow-sm transition-all z-10 relative select-none
            ${getTaskStatusColor(task)} 
            ${getStatusOpacity(task.status)} 
            ${isBeingDragged 
              ? 'border-4 border-blue-400 shadow-lg scale-105 z-20' 
              : 'border-2 border-white hover:shadow-md hover:scale-105'
            }
            ${dragState.isDragging ? 'cursor-grabbing' : ''}
          `}
          style={{
            ...taskBarStyle,
            cursor: dragState.isDragging ? 'grabbing' : hoverCursor,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          title={`${task.title} - ${getTaskStatusDescription(task)} - Asignado a: ${assignedTo}
${isBeingDragged ? '🔄 Arrastrando: ' + displayStartDate.toLocaleDateString() + ' - ' + displayDueDate.toLocaleDateString() : ''}
💡 Arrastra para mover fechas, extremos para redimensionar`}
        >
          {/* Contenido principal de la barra */}
          <div className="h-full flex items-center px-2 pointer-events-none">
            <span className="text-white text-xs font-medium truncate">
              {task.title}
            </span>
            {isBeingDragged && (
              <span className="ml-2 text-xs opacity-75">📅</span>
            )}
          </div>
          
          {/* Indicador de prioridad en la esquina superior derecha */}
          <div
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full pointer-events-none ${getPriorityColor(
              task.priority
            )} border border-white shadow-sm`}
            title={`Prioridad: ${task.priority}`}
          />
          
          {/* Indicador de asignación en la esquina superior izquierda */}
          <div
            className={`absolute -top-1 -left-1 w-3 h-3 rounded-full pointer-events-none ${
              isAssigned ? "bg-green-600" : "bg-gray-500"
            } border border-white shadow-sm`}
            title={`${isAssigned ? "✓ Asignada" : "⚠ Sin asignar"}`}
          />

          {/* Indicadores de resize en los extremos */}
          {!dragState.isDragging && (
            <>
              {/* Zona de resize izquierda */}
              <div 
                className="absolute left-0 top-0 w-2 h-full cursor-col-resize bg-gradient-to-r from-white/20 to-transparent rounded-l-lg"
                title="Arrastrar para cambiar fecha de inicio"
              />
              {/* Zona de resize derecha */}
              <div 
                className="absolute right-0 top-0 w-2 h-full cursor-col-resize bg-gradient-to-l from-white/20 to-transparent rounded-r-lg"
                title="Arrastrar para cambiar fecha de fin"
              />
            </>
          )}

          {/* Indicador de drag activo */}
          {isBeingDragged && (
            <div className="absolute inset-0 bg-blue-400/20 rounded-lg pointer-events-none">
              <div className="absolute inset-0 border-2 border-dashed border-blue-300 rounded-lg"></div>
            </div>
          )}
        </div>

        {/* Indicadores de fechas en los extremos - usando fechas de display */}
        <div
          className={`absolute top-1 text-xs font-mono bg-white px-1 py-0.5 rounded shadow-sm border z-20 
            ${isBeingDragged ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-gray-600'}`}
          style={{
            left: `${getDayPosition(displayStartDate, dateRange)}%`,
          }}
          title="Fecha de inicio"
        >
          {displayStartDate.getDate()}/
          {displayStartDate.getMonth() + 1}
          {isBeingDragged && " ✨"}
        </div>
        <div
          className={`absolute top-1 text-xs font-mono bg-white px-1 py-0.5 rounded shadow-sm border z-20 transform -translate-x-full
            ${isBeingDragged ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-gray-600'}`}
          style={{
            left: `${getDayPosition(displayDueDate, dateRange)}%`,
          }}
          title="Fecha límite"
        >
          {displayDueDate.getDate()}/
          {displayDueDate.getMonth() + 1}
          {isBeingDragged && " ✨"}
        </div>
      </div>
    </div>
  );
};

export default TaskRow;