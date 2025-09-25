import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { Filter, Calendar, Eye } from "lucide-react";
import { getTasks, Task, updateTask } from "../services/taskService";
import { getProjects, Project } from "../services/projectService";
import TaskDetailsModal from "../components/TaskDetailModal";
import { useTimelineDrag } from "../hooks/useTimelineDrag";

interface BotonTimelineProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean;
}

const BotonTimeline: React.FC<BotonTimelineProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [filtroProyecto, setFiltroProyecto] = useState<string>("");
  const [selectedTaskForDetails, setSelectedTaskForDetails] =
    useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<"days" | "weeks" | "months">(
    "weeks"
  );

  // Log simple cuando cambia el viewMode
  useEffect(() => {
    console.log("📄 viewMode cambió a:", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (isActive) {
      loadTasks();
      loadProjects();
    }
  }, [isActive]);

  const loadTasks = async () => {
    try {
      const tasksData = await getTasks();
      console.log("📋 Tareas cargadas en Timeline:", {
        total: tasksData.length,
        sample: tasksData.slice(0, 2).map((t) => ({
          title: t.title,
          startDate: t.startDate,
          dueDate: t.dueDate,
          startDateType: typeof t.startDate,
          dueDateType: typeof t.dueDate,
        })),
      });
      setTasks(tasksData);
    } catch (error) {
      console.error("Error cargando tareas:", error);
      onToastMessage("Error al cargar las tareas");
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProyectos(projectsData);
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    }
  };

  // Función para refrescar datos después de drag & drop
  const refreshData = () => {
    loadTasks();
    loadProjects();
  };

  // Filtrar tareas que tienen fechas válidas
  const validTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const hasValidDates = task.startDate && task.dueDate;
      const matchesProject =
        filtroProyecto === "" ||
        (filtroProyecto === "sin-proyecto"
          ? !task.projectId
          : task.projectId?.toString() === filtroProyecto);
      return hasValidDates && matchesProject;
    });

    // LOG DEBUG
    console.log("🔍 DEBUG validTasks:", {
      totalTasks: tasks.length,
      validTasks: result.length,
      filtroProyecto,
      tasksWithDates: tasks.filter((t) => t.startDate && t.dueDate).length,
    });

    if (result.length > 0) {
      console.log(
        "✅ Primeras tareas válidas:",
        result.slice(0, 3).map((t) => ({
          title: t.title,
          startDate: t.startDate,
          dueDate: t.dueDate,
        }))
      );
    }

    return result;
  }, [tasks, filtroProyecto]);

  // Calcular rango de fechas para la vista
  const dateRange = useMemo(() => {
    if (validTasks.length === 0) return { start: new Date(), end: new Date() };

    const dates = validTasks.flatMap((task) => [
      new Date(task.startDate!),
      new Date(task.dueDate!),
    ]);

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Agregar margen
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    return { start: minDate, end: maxDate };
  }, [validTasks]);

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

  // Generar días individuales para las líneas de cuadrícula
  const dailyGrid = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [dateRange]);

  // Calcular posición de cada día en la cuadrícula
  const getDayPosition = (day: Date) => {
    const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
    const dayOffset = day.getTime() - dateRange.start.getTime();
    return (dayOffset / totalDuration) * 100;
  };

  // Determinar si un día debe mostrar etiqueta según el modo de vista
  const shouldShowDayLabel = (day: Date) => {
    if (viewMode === "days") {
      const totalDays = Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (totalDays <= 7) {
        // Si hay 7 días o menos, mostrar todos
        return true;
      } else if (totalDays <= 21) {
        // Si hay entre 8-21 días, mostrar cada 2 días
        return day.getDate() % 2 === 0;
      } else {
        // Si hay más de 21 días, mostrar solo lunes y jueves
        return day.getDay() === 1;
      }
    }
    if (viewMode === "weeks") return day.getDay() === 1;
    if (viewMode === "months") return day.getDate() === 1;
    return false;
  };

  const getProjectName = (projectId: number | undefined) => {
    if (!projectId) return "Sin proyecto";
    const project = proyectos.find((p) => p.id === projectId);
    return project ? project.name : `Proyecto #${projectId}`;
  };

  // Importar las funciones del nuevo sistema de colores
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-500";
      case "media":
        return "bg-yellow-500";
      case "baja":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusOpacity = (status: string) => {
    switch (status) {
      case "completada":
        return "opacity-80";
      default:
        return "opacity-100";
    }
  };

  // NUEVO: Sistema inteligente de colores
  const getTaskStatusColor = (task: Task) => {
    const now = new Date();
    
    if (task.status === "completada") {
      return "bg-green-600";
    }
    
    const startDate = new Date(task.startDate!);
    const dueDate = new Date(task.dueDate!);
    const isAssigned = !!(task.assignedTo);
    
    if (now > dueDate) {
      return "bg-red-500"; // Atrasada
    }
    
    if (now < startDate) {
      return "bg-blue-500"; // Por comenzar
    }
    
    return isAssigned ? "bg-green-500" : "bg-yellow-500"; // En rango
  };

  const getTaskStatusDescription = (task: Task) => {
    const now = new Date();
    
    if (task.status === "completada") {
      return "Completada ✅";
    }
    
    const startDate = new Date(task.startDate!);
    const dueDate = new Date(task.dueDate!);
    const isAssigned = !!(task.assignedTo);
    
    if (now > dueDate) {
      const daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return `Atrasada ${daysLate} día${daysLate > 1 ? 's' : ''} 🚨`;
    }
    
    if (now < startDate) {
      const daysToStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `Comienza en ${daysToStart} día${daysToStart > 1 ? 's' : ''} 📅`;
    }
    
    const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isAssigned) {
      return `En progreso - ${daysRemaining} día${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''} ⏰`;
    } else {
      return `Sin asignar - Vence en ${daysRemaining} día${daysRemaining > 1 ? 's' : ''} ⚠️`;
    }
  };

  // Calcular rango visible (simplificado)
  const visibleRange = dateRange;

  const getScaleFactor = () => {
    if (viewMode === "days") return 3.0; // Barras 3x más anchas
    if (viewMode === "months") return 0.3; // Barras 3x más estrechas
    return 1.0; // weeks = tamaño normal
  };

  // Calcular posición y ancho de la barra de tarea (SOLUCION DIRECTA)
  const getTaskBarStyle = (task: Task, isBeingDragged = false, previewStartDate?: Date, previewDueDate?: Date) => {
    try {
      // ✅ USAR EL MISMO RANGO que getDayPosition()
      const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
      
      const taskStartTime = isBeingDragged && previewStartDate 
        ? previewStartDate.getTime()
        : new Date(task.startDate!).getTime();
      const taskEndTime = isBeingDragged && previewDueDate 
        ? previewDueDate.getTime()
        : new Date(task.dueDate!).getTime();
      const taskDuration = taskEndTime - taskStartTime;
      
      // Posición básica usando el MISMO cálculo que getDayPosition()
      const leftPercent = ((taskStartTime - dateRange.start.getTime()) / totalDuration) * 100;
      
      // Ancho escalado según el modo de vista
      const baseWidthPercent = (taskDuration / totalDuration) * 100;
      const scaledWidthPercent = baseWidthPercent * getScaleFactor();
      
      return {
        left: `${Math.max(0, leftPercent)}%`,
        width: `${Math.max(2, Math.min(100, scaledWidthPercent))}%`,
      };
    } catch (error) {
      console.error("Error calculando barra:", error);
      return { left: "0%", width: "20%" };
    }
  };
  
  const formatIntervalLabel = (date: Date) => {
    if (viewMode === "days") {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
      });
    } else if (viewMode === "weeks") {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    } else {
      return date.toLocaleDateString("es-ES", {
        month: "short",
        year: "2-digit",
      });
    }
  };

  const hasScrollbar = () => {
    const container = document.querySelector('.max-h-96.overflow-y-auto');
    return container ? container.scrollHeight > container.clientHeight : false;
  };

  // Y modificar getDayPosition para la cabecera:
  const getDayPositionHeader = (day: Date) => {
    const basePosition = getDayPosition(day);
    const scrollbarCompensation = hasScrollbar() ? 1.5 : 0; // Ajuste experimental
    return Math.max(0, basePosition - scrollbarCompensation);
  };
  
  const renderContent = () => (
    <>
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
      <div className="bg-white rounded-xl shadow-md border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          {/* Filtro de proyecto */}
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              🔍 Filtrar por proyecto
            </label>
            <select
              value={filtroProyecto}
              onChange={(e) => setFiltroProyecto(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            >
              <option value="">Todos los proyectos</option>
              <option value="sin-proyecto">Sin proyecto</option>
              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id.toString()}>
                  {proyecto.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de vista */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              📅 Vista temporal
            </label>
            <div className="flex gap-2">
              {(["days", "weeks", "months"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    viewMode === mode
                      ? "bg-blue-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {mode === "days"
                    ? "Días"
                    : mode === "weeks"
                    ? "Semanas"
                    : "Meses"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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
          <div className="bg-gray-50 border-b">
            <div className="flex">
              <div className="w-80 p-4 border-r bg-gray-100">
                <span className="font-bold text-gray-700">Tarea</span>
              </div>
              <div className="flex-1 relative overflow-hidden pr-4">
                {/* Cuadrícula de días de fondo */}
                <div className="absolute inset-0">
                  {dailyGrid.map((day, index) => (
                    <div
                      key={index}
                      className="absolute top-0 bottom-0"
                      style={{
                        left: `calc(${getDayPosition(day)}% - ${getDayPosition(day) * 0.15}px)`,  // ← Compensación
                        borderLeft: shouldShowDayLabel(day)
                          ? "2px solid #D1D5DB"
                          : "1px solid #F3F4F6",
                      }}
                    />
                  ))}
                </div>

                {/* Etiquetas de fechas */}
                <div className="relative h-16 flex items-center">
                  {dailyGrid.filter(shouldShowDayLabel).map((day, index) => (
                    <div
                      key={index}
                      className="absolute text-xs font-mono text-gray-600 transform -translate-x-1/2"
                      style={{ left: `${getDayPosition(day)}%` }}
                    >
                      <div className="bg-white px-1 py-0.5 rounded border shadow-sm">
                        {formatIntervalLabel(day)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tareas con cuadrícula de fondo Y DRAG & DROP */}
          <div className="max-h-96 overflow-y-auto">
            {validTasks.map((task) => {
              // Determinar si esta tarea está siendo arrastrada
              const isBeingDragged = dragState.isDragging && dragState.draggedTask?.id === task.id;
              
              // Usar fechas de preview si está siendo arrastrada
              const displayStartDate = isBeingDragged && dragState.previewStartDate 
                ? dragState.previewStartDate 
                : new Date(task.startDate!);
              const displayDueDate = isBeingDragged && dragState.previewDueDate 
                ? dragState.previewDueDate 
                : new Date(task.dueDate!);

              const taskBarStyle = getTaskBarStyle(task, isBeingDragged, dragState.previewStartDate || undefined, dragState.previewDueDate || undefined);
              const isAssigned = !!(task.assignedTo);

              return (
                <div
                  key={task.id}
                  className="flex border-b border-gray-100 hover:bg-gray-50"
                >
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
                      <div className="flex items-center gap-2">
                        {/* Indicador de asignación */}
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isAssigned ? "bg-green-500" : "bg-gray-400"
                          }`}
                          title={`${isAssigned ? "✓ Asignada" : "⚠ Sin asignar"}`}
                        />
                        {/* Indicador de prioridad más pequeño */}
                        <span
                          className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                          title={`Prioridad: ${task.priority}`}
                        />
                        <span className="text-xs text-gray-600 font-medium">
                          {getTaskStatusDescription(task)}
                        </span>
                        <button
                          onClick={() => setSelectedTaskForDetails(task)}
                          className="ml-auto p-1 hover:bg-gray-200 rounded"
                          title="Ver detalles"
                        >
                          <Eye className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                      {/* Info de asignación */}
                      <div className="text-xs text-gray-500 truncate">
                        👤 {task.assignedTo || "Sin asignar"}
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

                  {/* Área de barras con cuadrÍcula Y DRAG & DROP */}
                  <div className="flex-1 relative h-20 overflow-hidden">
                    {/* Líneas de cuadrícula de fondo */}
                    <div className="absolute inset-0">
                      {dailyGrid.map((day, index) => (
                        <div
                          key={index}
                          className="absolute top-0 bottom-0"
                          style={{
                            left: `${getDayPosition(day)}%`,
                            borderLeft: shouldShowDayLabel(day)
                              ? "2px solid #D1D5DB"
                              : "1px solid #F3F4F6",
                          }}
                        />
                      ))}
                    </div>

                    {/* Barra de tarea con DRAG & DROP */}
                    <div
                      className={`absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg shadow-sm transition-all z-10 relative select-none
                        ${getTaskStatusColor(task)} 
                        ${getStatusOpacity(task.status)}
                        ${isBeingDragged 
                          ? 'border-4 border-blue-400 shadow-lg scale-105 z-20 cursor-grabbing' 
                          : 'border-2 border-white hover:shadow-md hover:scale-105 cursor-grab'
                        }
                      `}
                      style={taskBarStyle}
                      onMouseDown={(e) => {
                        if (containerRef.current) {
                          const barElement = e.currentTarget as HTMLElement;
                          handleDragStart(e, task, barElement);
                        }
                      }}
                      onClick={(e) => {
                        if (!dragState.isDragging) {
                          setSelectedTaskForDetails(task);
                        }
                      }}
                      title={`${task.title} - ${getTaskStatusDescription(task)} - Asignado a: ${task.assignedTo || "Sin asignar"}
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
                      
                      {/* Indicador de prioridad en esquina superior derecha */}
                      <div
                        className={`absolute -top-1 -right-1 w-3 h-3 rounded-full pointer-events-none ${getPriorityColor(
                          task.priority
                        )} border border-white shadow-sm`}
                        title={`Prioridad: ${task.priority}`}
                      />
                      
                      {/* Indicador de asignación en esquina superior izquierda */}
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
                        left: `${getDayPosition(displayStartDate)}%`,
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
                        left: `${getDayPosition(displayDueDate)}%`,
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
            })}
          </div>
        </div>
      )}

      {/* NUEVA LEYENDA - Sistema inteligente de colores */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border-2 border-blue-100">
        <h4 className="font-semibold text-gray-800 mb-3 text-center">🎯 Sistema Inteligente de Estado + Drag & Drop</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Por comenzar 📅</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>En progreso ✅</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Sin asignar ⚠️</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Atrasada 🚨</span>
          </div>
        </div>

        {/* Controles de drag & drop */}
        <div className="bg-white rounded-lg p-3 border border-purple-200 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">✋</span>
            <span className="font-medium text-purple-700">Controles Interactivos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-500 rounded cursor-grab"></span>
              <span><strong>Centro:</strong> Mover tarea</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-400 rounded cursor-col-resize"></span>
              <span><strong>Extremos:</strong> Redimensionar</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-purple-600">⌨️</span>
              <span><strong>ESC:</strong> Cancelar</span>
            </div>
          </div>
        </div>
        
        {/* Indicadores adicionales */}
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>Asignada</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Sin asignar</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Alta prioridad</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Media prioridad</span>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-center text-blue-800">
          <strong>🧠 Sistema inteligente:</strong> Los colores combinan estado temporal + asignación. 
          <strong> Ahora con drag & drop para cambiar fechas visualmente!</strong>
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedTaskForDetails && (
        <TaskDetailsModal
          task={selectedTaskForDetails}
          projectName={getProjectName(selectedTaskForDetails.projectId)}
          onClose={() => setSelectedTaskForDetails(null)}
          onEdit={() => {
            setSelectedTaskForDetails(null);
            onToastMessage("Para editar, ve a la sección de Tareas");
          }}
        />
      )}
    </>
  );

  if (onlyContent) {
    return <div className="max-w-7xl mx-auto">{renderContent()}</div>;
  }

  if (!isActive) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-blue-400 hover:bg-blue-500 shadow-lg text-white text-sm transition-all duration-200"
        >
          <ChartBarIcon className="w-7 h-7 mb-1" />
          <span className="font-medium">Timeline</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-blue-400 hover:bg-blue-500 shadow-lg text-white text-sm transition-all duration-200 relative z-10 ring-4 ring-offset-2 ring-blue-200 shadow-blue-200/70 shadow-xl"
          style={{ transform: "scale(1.2)" }}
        >
          <ChartBarIcon className="w-9 h-9 mb-1" />
          <span className="font-medium">Timeline</span>
        </button>
      </div>

      <div className="mt-10 relative">
        <div className="min-h-96">{renderContent()}</div>
      </div>
    </>
  );
};

export default BotonTimeline;