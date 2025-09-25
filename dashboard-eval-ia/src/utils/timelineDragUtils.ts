import { Task, DateRange } from "../components/timeline/types/timeline";

export interface DragState {
  isDragging: boolean;
  draggedTask: Task | null;
  dragType: 'move' | 'resize-start' | 'resize-end' | null;
  initialMouseX: number;
  initialStartDate: Date | null;
  initialDueDate: Date | null;
  previewStartDate: Date | null;
  previewDueDate: Date | null;
}

export const createInitialDragState = (): DragState => ({
  isDragging: false,
  draggedTask: null,
  dragType: null,
  initialMouseX: 0,
  initialStartDate: null,
  initialDueDate: null,
  previewStartDate: null,
  previewDueDate: null,
});

/**
 * Calcular fecha basada en la posición X en el timeline
 */
export const calculateDateFromPosition = (
  mouseX: number,
  containerRect: DOMRect,
  dateRange: DateRange
): Date => {
  const relativeX = mouseX - containerRect.left;
  const containerWidth = containerRect.width;
  const percentage = Math.max(0, Math.min(100, (relativeX / containerWidth) * 100));
  
  const totalDuration = dateRange.end.getTime() - dateRange.start.getTime();
  const timeOffset = (percentage / 100) * totalDuration;
  
  return new Date(dateRange.start.getTime() + timeOffset);
};

/**
 * Calcular nuevas fechas para movimiento de tarea completa
 */
export const calculateMovedTaskDates = (
  task: Task,
  newStartDate: Date
): { startDate: Date; dueDate: Date } => {
  const originalStartDate = new Date(task.startDate!);
  const originalDueDate = new Date(task.dueDate!);
  const duration = originalDueDate.getTime() - originalStartDate.getTime();
  
  const newDueDate = new Date(newStartDate.getTime() + duration);
  
  return {
    startDate: newStartDate,
    dueDate: newDueDate,
  };
};

/**
 * Validar que las fechas sean válidas
 */
export const validateTaskDates = (
  startDate: Date,
  dueDate: Date
): { isValid: boolean; error?: string } => {
  if (startDate >= dueDate) {
    return {
      isValid: false,
      error: "La fecha de inicio debe ser anterior a la fecha de fin",
    };
  }
  
  // Validar que no sean fechas muy en el pasado (opcional)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 2);
  
  if (startDate < minDate) {
    return {
      isValid: false,
      error: "La fecha de inicio es demasiado antigua",
    };
  }
  
  // Validar que no sean fechas muy futuras (opcional)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 5);
  
  if (dueDate > maxDate) {
    return {
      isValid: false,
      error: "La fecha de fin es demasiado lejana",
    };
  }
  
  return { isValid: true };
};

/**
 * Redondear fecha al día más cercano
 */
export const roundToNearestDay = (date: Date): Date => {
  const rounded = new Date(date);
  rounded.setHours(12, 0, 0, 0); // Mediodía para evitar problemas de zona horaria
  return rounded;
};

/**
 * Detectar qué parte de la barra se está arrastrando
 */
export const detectDragType = (
  mouseX: number,
  barRect: DOMRect
): 'move' | 'resize-start' | 'resize-end' => {
  const relativeX = mouseX - barRect.left;
  const barWidth = barRect.width;
  
  // Zona de resize: 20% en cada extremo
  const resizeZone = Math.max(8, barWidth * 0.2);
  
  if (relativeX <= resizeZone) {
    return 'resize-start';
  } else if (relativeX >= barWidth - resizeZone) {
    return 'resize-end';
  } else {
    return 'move';
  }
};

/**
 * Obtener cursor apropiado según el tipo de drag
 */
export const getDragCursor = (dragType: DragState['dragType']): string => {
  switch (dragType) {
    case 'move':
      return 'grabbing';
    case 'resize-start':
    case 'resize-end':
      return 'col-resize';
    default:
      return 'default';
  }
};

/**
 * Formatear fecha para mostrar durante el drag
 */
export const formatDateForPreview = (date: Date): string => {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Calcular el cambio mínimo en días para evitar micro-movimientos
 */
export const getMinimumDaysDelta = (): number => {
  return 1; // Mínimo 1 día de diferencia
};

/**
 * Comprobar si las fechas han cambiado significativamente
 */
export const hasSignificantDateChange = (
  originalStart: Date,
  originalDue: Date,
  newStart: Date,
  newDue: Date
): boolean => {
  const minDelta = getMinimumDaysDelta() * 24 * 60 * 60 * 1000; // 1 día en ms
  
  const startDelta = Math.abs(originalStart.getTime() - newStart.getTime());
  const dueDelta = Math.abs(originalDue.getTime() - newDue.getTime());
  
  return startDelta >= minDelta || dueDelta >= minDelta;
};