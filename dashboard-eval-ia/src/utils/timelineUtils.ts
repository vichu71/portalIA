import { Task, ViewMode, DateRange, TaskBarStyle } from "../components/timeline/types/timeline";

/**
 * Filtrar tareas que tienen fechas válidas
 */
export const filterValidTasks = (tasks: Task[], projectFilter: string): Task[] => {
  return tasks.filter((task) => {
    const hasValidDates = task.startDate && task.dueDate;
    const matchesProject =
      projectFilter === "" ||
      (projectFilter === "sin-proyecto"
        ? !task.projectId
        : task.projectId?.toString() === projectFilter);
    return hasValidDates && matchesProject;
  });
};

/**
 * Calcular rango de fechas del timeline
 */
export const calculateDateRange = (tasks: Task[]): DateRange => {
  if (tasks.length === 0) return { start: new Date(), end: new Date() };

  const dates = tasks.flatMap((task) => [
    new Date(task.startDate!),
    new Date(task.dueDate!),
  ]);

  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Agregar margen
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 3);

  return { start: minDate, end: maxDate };
};

/**
 * Generar cuadrícula diaria para el timeline
 */
export const generateDailyGrid = (dateRange: DateRange): Date[] => {
  const days: Date[] = [];
  const current = new Date(dateRange.start);

  while (current <= dateRange.end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

/**
 * Calcular posición de un día en el timeline
 */
export const getDayPosition = (day: Date, dateRange: DateRange): number => {
  const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
  const dayOffset = day.getTime() - dateRange.start.getTime();
  return (dayOffset / totalDuration) * 100;
};

/**
 * Determinar si un día debe mostrar etiqueta según el modo de vista
 */
export const shouldShowDayLabel = (day: Date, viewMode: ViewMode, dateRange: DateRange): boolean => {
  if (viewMode === "days") {
    const totalDays = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (totalDays <= 7) {
      return true;
    } else if (totalDays <= 21) {
      return day.getDate() % 2 === 0;
    } else {
      return day.getDay() === 1;
    }
  }
  if (viewMode === "weeks") return day.getDay() === 1;
  if (viewMode === "months") return day.getDate() === 1;
  return false;
};

/**
 * Formatear etiqueta de intervalo según el modo de vista
 */
export const formatIntervalLabel = (date: Date, viewMode: ViewMode): string => {
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

/**
 * Obtener factor de escala según el modo de vista
 */
const getScaleFactor = (viewMode: ViewMode): number => {
  if (viewMode === "days") return 3.0; // Barras 3x más anchas
  if (viewMode === "months") return 0.3; // Barras 3x más estrechas
  return 1.0; // weeks = tamaño normal
};

/**
 * Calcular estilo de barra de tarea
 */
export const getTaskBarStyle = (
  task: Task,
  dateRange: DateRange,
  viewMode: ViewMode
): TaskBarStyle => {
  try {
    const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
    
    const taskStartTime = new Date(task.startDate!).getTime();
    const taskEndTime = new Date(task.dueDate!).getTime();
    const taskDuration = taskEndTime - taskStartTime;
    
    // Posición básica
    const leftPercent = ((taskStartTime - dateRange.start.getTime()) / totalDuration) * 100;
    
    // Ancho escalado según el modo de vista
    const baseWidthPercent = (taskDuration / totalDuration) * 100;
    const scaledWidthPercent = baseWidthPercent * getScaleFactor(viewMode);
    
    return {
      left: `${Math.max(0, leftPercent)}%`,
      width: `${Math.max(2, Math.min(100, scaledWidthPercent))}%`,
    };
  } catch (error) {
    console.error("Error calculando barra:", error);
    return { left: "0%", width: "20%" };
  }
};

/**
 * Verificar si una tarea está asignada
 * Solo usando las propiedades que realmente existen en el tipo Task
 */
const isTaskAssigned = (task: Task): boolean => {
  // Usar solo task.assignedTo que es la propiedad que realmente existe
  return !!(task.assignedTo);
};

/**
 * NUEVO: Obtener color basado en fecha y asignación
 */
export const getTaskStatusColor = (task: Task): string => {
  const now = new Date();
  
  // Si está completada, siempre verde oscuro
  if (task.status === "completada") {
    return "bg-green-600"; // Verde más oscuro para completadas
  }
  
  const startDate = new Date(task.startDate!);
  const dueDate = new Date(task.dueDate!);
  const isAssigned = isTaskAssigned(task);
  
  // 🔴 ROJO: Fuera del rango (atrasada), aunque esté asignada
  if (now > dueDate) {
    return "bg-red-500";
  }
  
  // 🔵 AZUL: Antes del rango (aún no ha comenzado)
  if (now < startDate) {
    return "bg-blue-500";
  }
  
  // En el rango (entre startDate y dueDate):
  // 🟢 VERDE: En el rango + asignada
  if (isAssigned) {
    return "bg-green-500";
  }
  
  // 🟡 AMARILLO: En el rango + NO asignada
  return "bg-yellow-500";
};

/**
 * NUEVO: Obtener descripción del estado basado en fecha y asignación
 */
export const getTaskStatusDescription = (task: Task): string => {
  const now = new Date();
  
  if (task.status === "completada") {
    return "Completada ✅";
  }
  
  const startDate = new Date(task.startDate!);
  const dueDate = new Date(task.dueDate!);
  const isAssigned = isTaskAssigned(task);
  
  // Fuera del rango (atrasada)
  if (now > dueDate) {
    const daysLate = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return `Atrasada ${daysLate} día${daysLate > 1 ? 's' : ''} 🚨`;
  }
  
  // Antes del rango
  if (now < startDate) {
    const daysToStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Comienza en ${daysToStart} día${daysToStart > 1 ? 's' : ''} 📅`;
  }
  
  // En el rango
  const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (isAssigned) {
    return `En progreso - ${daysRemaining} día${daysRemaining > 1 ? 's' : ''} restante${daysRemaining > 1 ? 's' : ''} ⏰`;
  } else {
    return `Sin asignar - Vence en ${daysRemaining} día${daysRemaining > 1 ? 's' : ''} ⚠️`;
  }
};

/**
 * Obtener color de prioridad (ahora solo para indicadores pequeños)
 */
export const getPriorityColor = (priority: string): string => {
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

/**
 * Obtener opacidad según el estado
 */
export const getStatusOpacity = (status: string): string => {
  switch (status) {
    case "completada":
      return "opacity-80";
    default:
      return "opacity-100";
  }
};

/**
 * NUEVO: Obtener información detallada del estado de asignación
 */
export const getAssignmentInfo = (task: Task): { isAssigned: boolean; assignedTo: string } => {
  const isAssigned = isTaskAssigned(task);
  let assignedTo = "Sin asignar";
  
  if (task.assignedTo) {
    assignedTo = task.assignedTo;
  }
  
  return { isAssigned, assignedTo };
};