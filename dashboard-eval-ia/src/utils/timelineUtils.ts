import { Task, ViewMode, DateRange, TaskBarStyle } from "../components/timeline/types/timeline";

/**
 * Filtra las tareas que tienen fechas válidas y coinciden con el filtro de proyecto
 */
export const filterValidTasks = (
  tasks: Task[],
  projectFilter: string
): Task[] => {
  return tasks.filter((task) => {
    const hasValidDates = task.createdAt && task.dueDate;
    const matchesProject =
      projectFilter === "" ||
      (projectFilter === "sin-proyecto"
        ? !task.projectId
        : task.projectId?.toString() === projectFilter);
    return hasValidDates && matchesProject;
  });
};

/**
 * Calcula el rango de fechas para mostrar en el timeline
 */
export const calculateDateRange = (tasks: Task[]): DateRange => {
  if (tasks.length === 0) {
    const now = new Date();
    return { start: now, end: now };
  }

  const dates = tasks.flatMap((task) => [
    new Date(task.createdAt!),
    new Date(task.dueDate!),
  ]);

  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Agregar margen de 3 días
  minDate.setDate(minDate.getDate() - 3);
  maxDate.setDate(maxDate.getDate() + 3);

  return { start: minDate, end: maxDate };
};

/**
 * Genera array de días para la cuadrícula
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
 * Calcula la posición de un día en la cuadrícula (0-100%)
 */
export const getDayPosition = (day: Date, dateRange: DateRange): number => {
  const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
  const dayOffset = day.getTime() - dateRange.start.getTime();
  return (dayOffset / totalDuration) * 100;
};

/**
 * Determina si un día debe mostrar etiqueta según el modo de vista
 */
export const shouldShowDayLabel = (day: Date, viewMode: ViewMode, dateRange: DateRange): boolean => {
  if (viewMode === "days") {
    const totalDays = Math.ceil(
      (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (totalDays <= 7) {
      return true;
    } else if (totalDays <= 21) {
      return day.getDate() % 2 === 0;
    } else {
      return day.getDay() === 1; // Solo lunes
    }
  }
  if (viewMode === "weeks") return day.getDay() === 1; // Lunes
  if (viewMode === "months") return day.getDate() === 1; // Primer día del mes
  return false;
};

/**
 * Obtiene el factor de escala para las barras según el modo de vista
 */
export const getScaleFactor = (viewMode: ViewMode): number => {
  switch (viewMode) {
    case "days":
      return 3.0; // Barras 3x más anchas
    case "months":
      return 0.3; // Barras 3x más estrechas
    case "weeks":
    default:
      return 1.0; // Tamaño normal
  }
};

/**
 * Calcula el estilo (posición y ancho) de la barra de una tarea
 */
export const getTaskBarStyle = (
  task: Task,
  dateRange: DateRange,
  viewMode: ViewMode
): TaskBarStyle => {
  try {
    const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
    
    const taskStartTime = new Date(task.createdAt!).getTime();
    const taskEndTime = new Date(task.dueDate!).getTime();
    const taskDuration = taskEndTime - taskStartTime;
    
    // Posición usando el mismo cálculo que getDayPosition()
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
 * Formatea una fecha para mostrar en las etiquetas del timeline
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
 * Obtiene el color de la prioridad de una tarea (para indicador secundario)
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
 * Obtiene el color principal de la barra basado en estado + fechas
 * 🟢 Verde: Completada
 * 🟡 Amarillo: En progreso/pendiente dentro de plazo
 * 🔴 Rojo: NO completada y fecha límite pasada (OVERDUE)
 * 🔵 Azul: Pendiente, fecha inicio futura
 */
export const getTaskStatusColor = (task: Task): string => {
  const now = new Date();
  const startDate = new Date(task.createdAt!);
  const dueDate = new Date(task.dueDate!);
  
  // Si está completada, siempre verde ✅
  if (task.status === "completada") {
    return "bg-green-500";
  }
  
  // Si la fecha límite ya pasó y NO está completada = OVERDUE 🚨
  if (dueDate < now) {
    return "bg-red-500";
  }
  
  // Si la fecha de inicio es futura = aún no comenzada 🔵
  if (startDate > now) {
    return "bg-blue-500";
  }
  
  // Si está en el rango de fechas (en progreso o pendiente) = OK 🟡
  return "bg-amber-500";
};

/**
 * Obtiene el texto descriptivo del estado de la tarea
 */
export const getTaskStatusDescription = (task: Task): string => {
  const now = new Date();
  const startDate = new Date(task.createdAt!);
  const dueDate = new Date(task.dueDate!);
  
  if (task.status === "completada") {
    return "Completada ✅";
  }
  
  if (dueDate < now) {
    const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return `Atrasada ${daysOverdue} día${daysOverdue > 1 ? 's' : ''} 🚨`;
  }
  
  if (startDate > now) {
    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `Comienza en ${daysUntilStart} día${daysUntilStart > 1 ? 's' : ''} 📅`;
  }
  
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return `${daysLeft} día${daysLeft > 1 ? 's' : ''} restante${daysLeft > 1 ? 's' : ''} ⏰`;
};

/**
 * Obtiene la opacidad según el estado de la tarea
 */
export const getStatusOpacity = (status: string): string => {
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