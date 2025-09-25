import { useState, useCallback, useRef, useEffect } from "react";
import { Task, DateRange, DragState } from "../components/timeline/types/timeline";
import {
  createInitialDragState,
  calculateDateFromPosition,
  calculateMovedTaskDates,
  validateTaskDates,
  roundToNearestDay,
  detectDragType,
  hasSignificantDateChange,
} from "../utils/timelineDragUtils";

interface UseTimelineDragProps {
  dateRange: DateRange;
  onTaskUpdate: (task: Task, newStartDate: Date, newDueDate: Date) => void;
  onToastMessage: (message: string) => void;
}

export const useTimelineDrag = ({
  dateRange,
  onTaskUpdate,
  onToastMessage,
}: UseTimelineDragProps) => {
  const [dragState, setDragState] = useState<DragState>(createInitialDragState);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Iniciar drag
  const handleDragStart = useCallback(
    (event: React.MouseEvent, task: Task, barElement: HTMLElement) => {
      event.preventDefault();
      event.stopPropagation();

      const mouseX = event.clientX;
      const barRect = barElement.getBoundingClientRect();
      const dragType = detectDragType(mouseX, barRect);

      const initialStartDate = new Date(task.startDate!);
      const initialDueDate = new Date(task.dueDate!);

      setDragState({
        isDragging: true,
        draggedTask: task,
        dragType,
        initialMouseX: mouseX,
        initialStartDate,
        initialDueDate,
        previewStartDate: initialStartDate,
        previewDueDate: initialDueDate,
      });

      isDragging.current = true;

      // Cambiar cursor del documento
      document.body.style.cursor = dragType === 'move' ? 'grabbing' : 'col-resize';
      document.body.style.userSelect = 'none';
    },
    []
  );

  // Manejar movimiento durante drag
  const handleDragMove = useCallback(
    (event: MouseEvent) => {
      if (!dragState.isDragging || !dragState.draggedTask || !containerRef.current) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const newDate = calculateDateFromPosition(event.clientX, containerRect, dateRange);
      const roundedDate = roundToNearestDay(newDate);

      let newStartDate: Date;
      let newDueDate: Date;

      switch (dragState.dragType) {
        case 'move': {
          const movedDates = calculateMovedTaskDates(dragState.draggedTask, roundedDate);
          newStartDate = movedDates.startDate;
          newDueDate = movedDates.dueDate;
          break;
        }
        case 'resize-start': {
          newStartDate = roundedDate;
          newDueDate = dragState.initialDueDate!;
          break;
        }
        case 'resize-end': {
          newStartDate = dragState.initialStartDate!;
          newDueDate = roundedDate;
          break;
        }
        default:
          return;
      }

      // Validar fechas
      const validation = validateTaskDates(newStartDate, newDueDate);
      if (!validation.isValid) {
        return; // No actualizar si las fechas no son válidas
      }

      setDragState(prev => ({
        ...prev,
        previewStartDate: newStartDate,
        previewDueDate: newDueDate,
      }));
    },
    [dragState, dateRange]
  );

  // Finalizar drag
  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedTask) {
      return;
    }

    const {
      draggedTask,
      initialStartDate,
      initialDueDate,
      previewStartDate,
      previewDueDate,
    } = dragState;

    // Restaurar cursor
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Verificar si hubo cambios significativos
    if (
      previewStartDate &&
      previewDueDate &&
      hasSignificantDateChange(
        initialStartDate!,
        initialDueDate!,
        previewStartDate,
        previewDueDate
      )
    ) {
      // Aplicar cambios
      onTaskUpdate(draggedTask, previewStartDate, previewDueDate);
      onToastMessage(
        `Tarea "${draggedTask.title}" actualizada: ${previewStartDate.toLocaleDateString()} - ${previewDueDate.toLocaleDateString()}`
      );
    }

    // Limpiar estado
    setDragState(createInitialDragState);
    isDragging.current = false;
  }, [dragState, onTaskUpdate, onToastMessage]);

  // Cancelar drag (ESC key)
  const handleDragCancel = useCallback(() => {
    if (dragState.isDragging) {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDragState(createInitialDragState);
      isDragging.current = false;
      onToastMessage("Movimiento cancelado");
    }
  }, [dragState.isDragging, onToastMessage]);

  // Obtener cursor para hover
  const getHoverCursor = useCallback((mouseX: number, barRect: DOMRect): string => {
    if (dragState.isDragging) return 'grabbing';
    
    const dragType = detectDragType(mouseX, barRect);
    switch (dragType) {
      case 'move':
        return 'grab';
      case 'resize-start':
      case 'resize-end':
        return 'col-resize';
      default:
        return 'pointer';
    }
  }, [dragState.isDragging]);

  // Event listeners globales
  useEffect(() => {
    if (dragState.isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleDragCancel();
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [dragState.isDragging, handleDragMove, handleDragEnd, handleDragCancel]);

  return {
    dragState,
    containerRef,
    handleDragStart,
    getHoverCursor,
    isDragActive: dragState.isDragging,
  };
};