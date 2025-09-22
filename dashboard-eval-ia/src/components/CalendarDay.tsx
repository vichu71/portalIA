// components/CalendarDay.tsx
import React from "react";
import { Task } from "../services/taskService";
import { DailyNote } from "../services/dailyNoteService";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasksCreated: Task[];
  tasksWithDeadline: Task[];
  hasNote: DailyNote | undefined;
  isDragOver: boolean;
  draggedTask: Task | null;
  isBetweenHighlightedTask: boolean;
  rangeSegment?: "none" | "past" | "today" | "future";
  onDayClick: (date: Date, e: React.MouseEvent) => void;
  onDragOver: (e: React.DragEvent, date: Date) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, date: Date) => void;
  onTaskSingleClick: (task: Task, e?: React.MouseEvent) => void;
  onTaskDoubleClick: (task: Task, e?: React.MouseEvent) => void;
  onTaskDragStart: (e: React.DragEvent, task: Task) => void;
  onTaskDragEnd: (e: React.DragEvent) => void;
  shouldHighlightTask: (task: Task) => boolean;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  isCurrentMonth,
  isToday,
  tasksCreated,
  tasksWithDeadline,
  hasNote,
  isDragOver,
  draggedTask,
  isBetweenHighlightedTask,
  rangeSegment = "none",
  onDayClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskSingleClick,
  onTaskDoubleClick,
  onTaskDragStart,
  onTaskDragEnd,
  shouldHighlightTask,
}) => {
  
  // LÓGICA CORREGIDA: Priorizar estilos de rango sobre estilos base
  let baseClasses = "";
  let backgroundClasses = "";
  let borderClasses = "border rounded-lg";
  
  // 1. Estilos base según el mes
  if (isCurrentMonth) {
    baseClasses = "text-gray-900";
    borderClasses += " border-gray-200";
  } else {
    baseClasses = "text-gray-400";
    borderClasses += " border-gray-100";
  }
  
  // 2. Background: Priorizar rango sobre otros estilos
  if (rangeSegment !== "none") {
    // Si está en un rango de tarea, usar colores de rango
    if (rangeSegment === "past") {
      backgroundClasses = "bg-red-100"; // Más visible que bg-red-500/15
      borderClasses = "border-2 border-red-400 rounded-lg";
    } else if (rangeSegment === "future") {
      backgroundClasses = "bg-green-100"; // Más visible que bg-green-500/15
      borderClasses = "border-2 border-green-400 rounded-lg";
    } else if (rangeSegment === "today") {
      backgroundClasses = "bg-gradient-to-r from-red-100 to-green-100";
      borderClasses = "border-2 border-blue-500 rounded-lg ring-2 ring-blue-300";
    }
  } else if (isToday) {
    // Solo aplicar estilo de "hoy" si NO está en un rango
    backgroundClasses = "bg-green-50";
    borderClasses = "border rounded-lg ring-2 ring-green-400";
  } else if (isCurrentMonth) {
    backgroundClasses = "bg-white";
  } else {
    backgroundClasses = "bg-gray-50";
  }
  
  // 3. Drag & drop (siempre tiene prioridad)
  if (isDragOver) {
    backgroundClasses = "bg-blue-50 scale-105 shadow-lg";
    borderClasses = "border-2 border-blue-300 rounded-lg ring-2 ring-blue-400";
  }

  return (
    <div
      className={`min-h-24 p-2 relative cursor-pointer hover:bg-opacity-80 transition-all duration-200 ${baseClasses} ${backgroundClasses} ${borderClasses}`}
      onClick={(e) => onDayClick(date, e)}
      onDragOver={(e) => onDragOver(e, date)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, date)}
    >
      {/* Indicador visual de zona de drop */}
      {isDragOver && draggedTask && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg bg-blue-100 bg-opacity-50 flex items-center justify-center">
          <span className="text-blue-600 font-bold text-sm">
            📌 Soltar aquí
          </span>
        </div>
      )}

      {/* Número del día */}
      <div
        className={`text-sm font-medium mb-1 flex items-center justify-between ${
          isToday ? "text-green-700 font-bold" : "text-gray-900"
        } ${isDragOver ? "opacity-50" : ""}`}
      >
        <span>{date.getDate()}</span>
        {/* Indicador de nota */}
        {hasNote && (
          <div
            className="w-2 h-2 bg-purple-500 rounded-full"
            title="Tiene notas del día"
          />
        )}
      </div>

      {/* Tareas creadas ese día y tareas que vencen */}
      <div className={`space-y-1 ${isDragOver ? "opacity-50" : ""}`}>
        {/* Tareas creadas ese día como cards (NO draggables) */}
        {tasksCreated.slice(0, 2).map((task) => {
          const isHighlighted = shouldHighlightTask(task);
          return (
            <div
              key={`created-${task.id}`}
              className={`text-xs p-2 rounded border-l-4 cursor-pointer hover:shadow-md transition-all task-item relative ${
                task.priority === "alta"
                  ? "bg-red-50 text-red-800 border-red-500 hover:bg-red-100"
                  : task.priority === "media"
                  ? "bg-yellow-50 text-yellow-800 border-yellow-500 hover:bg-yellow-100"
                  : "bg-blue-50 text-blue-800 border-blue-500 hover:bg-blue-100"
              } ${
                isHighlighted
                  ? "ring-2 ring-purple-400 shadow-lg bg-opacity-80 scale-105"
                  : ""
              }`}
              title={`Creada: ${task.title} (1 click: resaltar | 2 clicks: detalles)`}
              onClick={(e) => onTaskSingleClick(task, e)}
              onDoubleClick={(e) => onTaskDoubleClick(task, e)}
            >
              <div className="flex items-center justify-between">
                <span className="truncate flex-1">📝 {task.title}</span>
                {/* Indicador rojo si tiene fecha de finalización */}
                {task.dueDate && (
                  <div
                    className="w-2 h-2 bg-red-500 rounded-full ml-2 flex-shrink-0"
                    title={`Vence: ${task.dueDate}`}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Tareas con fecha de vencimiento ese día - DRAGGABLES */}
        {tasksWithDeadline.slice(0, 2).map((task) => {
          const isHighlighted = shouldHighlightTask(task);
          return (
            <div
              key={`deadline-${task.id}`}
              draggable
              onDragStart={(e) => onTaskDragStart(e, task)}
              onDragEnd={onTaskDragEnd}
              className={`text-xs p-2 rounded border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all task-item ${
                task.priority === "alta"
                  ? "bg-red-100 text-red-800 border-red-500 hover:bg-red-200"
                  : task.priority === "media"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-500 hover:bg-yellow-200"
                  : "bg-blue-100 text-blue-800 border-blue-500 hover:bg-blue-200"
              } ${draggedTask?.id === task.id ? "opacity-50 scale-95" : ""} ${
                isHighlighted
                  ? "ring-2 ring-purple-400 shadow-lg bg-opacity-80 scale-105"
                  : ""
              }`}
              title={`Arrastra para mover | 1 click: resaltar | 2 clicks: detalles - ${task.title}`}
              onClick={(e) => onTaskSingleClick(task, e)}
              onDoubleClick={(e) => onTaskDoubleClick(task, e)}
            >
              🎯 {task.title}
            </div>
          );
        })}

        {/* Indicador de más tareas */}
        {(tasksCreated.length > 2 || tasksWithDeadline.length > 2) && (
          <div
            className="text-xs text-gray-500 text-center cursor-pointer hover:text-gray-700 task-item p-1"
            title="Click para ver más tareas"
            onClick={(e) =>
              onTaskSingleClick(tasksCreated[0] || tasksWithDeadline[0], e)
            }
            onDoubleClick={(e) =>
              onTaskDoubleClick(tasksCreated[0] || tasksWithDeadline[0], e)
            }
          >
            +
            {Math.max(0, tasksCreated.length - 2) +
              Math.max(0, tasksWithDeadline.length - 2)}{" "}
            más
          </div>
        )}
      </div>
    </div>
  );
};