import React, { useState, useEffect, useMemo } from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { Filter, Calendar, Eye } from "lucide-react";
import { getTasks, Task } from "../services/taskService";
import { getProjects, Project } from "../services/projectService";
import TaskDetailsModal from "../components/TaskDetailModal";

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
    console.log("🔄 viewMode cambió a:", viewMode);
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
          createdAt: t.createdAt,
          dueDate: t.dueDate,
          createdAtType: typeof t.createdAt,
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

  // Filtrar tareas que tienen fechas válidas
  const validTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const hasValidDates = task.createdAt && task.dueDate;
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
      tasksWithDates: tasks.filter((t) => t.createdAt && t.dueDate).length,
    });

    if (result.length > 0) {
      console.log(
        "✅ Primeras tareas válidas:",
        result.slice(0, 3).map((t) => ({
          title: t.title,
          createdAt: t.createdAt,
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
      new Date(task.createdAt!),
      new Date(task.dueDate!),
    ]);

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Agregar margen
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    return { start: minDate, end: maxDate };
  }, [validTasks]);

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
        return "opacity-60";
      case "en_progreso":
        return "opacity-85";
      case "pendiente":
        return "opacity-100";
      default:
        return "opacity-100";
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
  const getTaskBarStyle = (task: Task) => {
  try {
    // ✅ USAR EL MISMO RANGO que getDayPosition()
    const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
    
    const taskStartTime = new Date(task.createdAt!).getTime();
    const taskEndTime = new Date(task.dueDate!).getTime();
    const taskDuration = taskEndTime - taskStartTime;
    
    // Posición básica usando el MISMO cálculo que getDayPosition()
    const leftPercent = ((taskStartTime - dateRange.start.getTime()) / totalDuration) * 100;
    
    // Ancho escalado según el modo de vista
    const baseWidthPercent = (taskDuration / totalDuration) * 100;
    const scaledWidthPercent = baseWidthPercent * getScaleFactor();
    
    console.log(
      `🔍 Barra "${task.title.substring(
        0,
        15
      )}": viewMode=${viewMode}, width=${scaledWidthPercent.toFixed(1)}%`
    );
    
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
        </h3>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-xl shadow-md border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
          {/* Filtro de proyecto */}
          <div className="flex-1">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              📁 Filtrar por proyecto
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

          {/* Tareas con cuadrícula de fondo */}
          <div className="max-h-96 overflow-y-auto">
            {validTasks.map((task) => (
              <div
                key={task.id}
                className="flex border-b border-gray-100 hover:bg-gray-50"
              >
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
                      <span
                        className={`w-2 h-2 rounded-full ${getPriorityColor(
                          task.priority
                        )}`}
                      ></span>
                      <span className="text-xs text-gray-500 capitalize">
                        {task.priority}
                      </span>
                      <button
                        onClick={() => setSelectedTaskForDetails(task)}
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
                          left: `${getDayPosition(day)}%`,
                          borderLeft: shouldShowDayLabel(day)
                            ? "2px solid #D1D5DB"
                            : "1px solid #F3F4F6",
                        }}
                      />
                    ))}
                  </div>

                  {/* Barra de tarea */}
                  <div
                    className={`absolute top-1/2 transform -translate-y-1/2 h-8 rounded-lg shadow-sm cursor-pointer hover:shadow-md hover:scale-105 transition-all z-10 ${getPriorityColor(
                      task.priority
                    )} ${getStatusOpacity(task.status)} border-2 border-white`}
                    style={getTaskBarStyle(task)}
                    onClick={() => setSelectedTaskForDetails(task)}
                    title={`${task.title} (${new Date(
                      task.createdAt!
                    ).toLocaleDateString()} - ${new Date(
                      task.dueDate!
                    ).toLocaleDateString()})`}
                  >
                    <div className="h-full flex items-center px-2">
                      <span className="text-white text-xs font-medium truncate">
                        {task.title}
                      </span>
                    </div>
                  </div>

                  {/* Indicadores de fechas en los extremos */}
                  <div
                    className="absolute top-1 text-xs font-mono text-gray-600 bg-white px-1 py-0.5 rounded shadow-sm border z-20"
                    style={{
  left: `${getDayPosition(new Date(task.createdAt!))}%`,
}}
                  >
                    {new Date(task.createdAt!).getDate()}/
                    {new Date(task.createdAt!).getMonth() + 1}
                  </div>
                  <div
                    className="absolute top-1 text-xs font-mono text-gray-600 bg-white px-1 py-0.5 rounded shadow-sm border z-20 transform -translate-x-full"
                    style={{
                      left: `${
                        ((new Date(task.dueDate!).getTime() -
                          visibleRange.start.getTime()) /
                          (visibleRange.end.getTime() -
                            visibleRange.start.getTime())) *
                        100
                      }%`,
                    }}
                  >
                    {new Date(task.dueDate!).getDate()}/
                    {new Date(task.dueDate!).getMonth() + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <div className="flex justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Alta prioridad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Media prioridad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Baja prioridad</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded opacity-60"></div>
            <span>Completada</span>
          </div>
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
