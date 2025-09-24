// hooks/useDragAndDrop.ts
import { useState } from 'react';
import { Task } from '../services/taskService';

export const useDragAndDrop = (
  onUpdateTask: (taskId: number, update: Partial<Task>) => Promise<{ ok?: boolean; message?: string } | any>,
  onToastMessage: (message: string) => void
) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  // Sin argumentos (así cuadra con DragAndDropHandlers del Kanban)
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // Debe devolver void y aceptar newStatus: string para cuadrar con KanbanView
  const handleDrop = (e: React.DragEvent, newStatus: string): void => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const goingToCompleted = newStatus === 'completada';
    const comingFromCompleted = draggedTask.status === 'completada' && newStatus !== 'completada';

    const payload: Partial<Task> = {
      status: newStatus as Task['status'], // "pendiente" | "en_progreso" | "completada"
    };

    if (goingToCompleted) {
      // A "completada" → ponemos hoy (el backend también lo auto-ajusta si falta)
      payload.completedDate = today;
    } else if (comingFromCompleted) {
      // Desde "completada" → limpiar fecha (el backend también lo hace por regla)
      (payload as any).completedDate = null;
    } else if (draggedTask.completedDate) {
      // Otros movimientos (entre no-completadas): conservar si existía
      payload.completedDate = draggedTask.completedDate;
    }

    // Ejecutamos async dentro para mantener la firma void
    (async () => {
      try {
        const result = await onUpdateTask(draggedTask.id, payload);
        if (result?.ok === false) {
          onToastMessage(result?.message || 'No se pudo mover la tarea');
        } else {
          const toText =
            newStatus === 'pendiente' ? 'Pendiente' :
            newStatus === 'en_progreso' ? 'En curso' :
            'Completada';
          onToastMessage(`Tarea movida a "${toText}"`);
        }
      } catch (err: any) {
        onToastMessage(err?.message || 'Error al mover la tarea');
      } finally {
        setDraggedTask(null);
      }
    })();
  };

  return {
    draggedTask,
    dragOverColumn,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
