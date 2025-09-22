// hooks/useCalendarLogic.ts
import { useState, useEffect } from "react";
import { getTasks, Task, updateTask } from "../services/taskService";
import { getProjects, Project } from "../services/projectService";
import { getCurrentMonthDailyNotes, createOrUpdateDailyNote, DailyNote } from "../services/dailyNoteService";

interface UseCalendarLogicProps {
  isActive: boolean;
  onToastMessage: (message: string) => void;
}

export const useCalendarLogic = ({ isActive, onToastMessage }: UseCalendarLogicProps) => {
  // Estados principales
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  
  // Estados para navegación del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estados para notas diarias
  const [dailyNotes, setDailyNotes] = useState<DailyNote[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [noteContent, setNoteContent] = useState("");
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Estados para drag & drop
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Estados para resaltado de tareas
  const [highlightedTask, setHighlightedTask] = useState<Task | null>(null);
  const [preventSingleClick, setPreventSingleClick] = useState(false);

  // Función auxiliar para formatear fechas de manera consistente
  const formatDateToLocalYMD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Función para normalizar fechas de diferentes formatos
  const normalizeDateString = (dateInput: string | Date): string => {
    if (!dateInput) return '';
    
    if (dateInput instanceof Date) {
      return formatDateToLocalYMD(dateInput);
    }
    
    if (typeof dateInput === 'string') {
      // Si contiene 'T', es formato ISO
      if (dateInput.includes('T')) {
        return formatDateToLocalYMD(new Date(dateInput));
      }
      // Si ya es YYYY-MM-DD, regresarlo tal como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
      }
      // Intentar parsearlo como fecha
      return formatDateToLocalYMD(new Date(dateInput));
    }
    
    return '';
  };

  // Cargar datos cuando el componente se monta o cambia el mes
  useEffect(() => {
    if (isActive) {
      loadTasks();
      loadProjects();
      loadDailyNotes();
    }
  }, [isActive, currentDate]);

 

  // Funciones de carga
  const loadTasks = () => {
    getTasks()
      .then(setTasks)
      .catch((err) => console.error("Error cargando tareas:", err));
  };

  const loadProjects = () => {
    getProjects()
      .then(setProyectos)
      .catch((err) => console.error("Error cargando proyectos:", err));
  };

  const loadDailyNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const notes = await getCurrentMonthDailyNotes();
      setDailyNotes(notes);
    } catch (error) {
      console.error("Error cargando notas:", error);
      onToastMessage("Error al cargar las notas del mes");
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Funciones de navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentDate.getFullYear() === now.getFullYear() && 
           currentDate.getMonth() === now.getMonth();
  };

  // Funciones auxiliares
  const getProjectName = (projectId: number | undefined) => {
    if (!projectId) return null;
    const project = proyectos.find((p) => p.id === projectId);
    return project ? project.name : `Proyecto #${projectId}`;
  };

  const shouldHighlightTask = (task: Task) => {
    if (!highlightedTask) return false;
    if (task.id === highlightedTask.id) return true;
    if (task.title === highlightedTask.title && 
        task.createdAt === highlightedTask.createdAt) {
      return true;
    }
    return false;
  };

 
  const isDayBetweenTask = (date: Date) => {
    if (!highlightedTask || !highlightedTask.createdAt || !highlightedTask.dueDate) {
      return false;
    }
    
    const dayString = formatDateToLocalYMD(date);
    const createdString = normalizeDateString(highlightedTask.createdAt);
    const dueString = highlightedTask.dueDate; // ya debería ser YYYY-MM-DD
    
    // Debug detallado
    const isInRange = dayString >= createdString && dayString <= dueString;
    const todayString = formatDateToLocalYMD(new Date());
    
   
    
    return isInRange;
  };

  const getNoteForDate = (dateString: string) => {
    return dailyNotes.find(note => note.date === dateString);
  };

  // Event handlers para tareas
  const handleTaskSingleClick = (task: Task, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setTimeout(() => {
      if (!preventSingleClick) {
        console.log('👆 Tarea seleccionada:', task.title, {
          createdAt: task.createdAt,
          dueDate: task.dueDate
        });
        setHighlightedTask(task);
      }
      setPreventSingleClick(false);
    }, 200);
  };

  const handleTaskDoubleClick = (task: Task, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setPreventSingleClick(true);
    setSelectedTaskForDetails(task);
  };

  // Event handlers para días
  const handleDayClick = (date: Date, e: React.MouseEvent, formatDateForNote: (date: Date) => string) => {
    if ((e.target as HTMLElement).closest('.task-item')) return;
    
    setHighlightedTask(null);
    
    const dateString = formatDateForNote(date);
    const existingNote = getNoteForDate(dateString);
    
    setSelectedDate(dateString);
    setNoteContent(existingNote?.content || "");
    setShowNoteModal(true);
  };

  // Funciones para notas diarias
  const saveNote = async () => {
    setIsSavingNote(true);
    try {
      const result = await createOrUpdateDailyNote({
        date: selectedDate,
        content: noteContent.trim()
      });
      
      if (result === null) {
        setDailyNotes(prevNotes => 
          prevNotes.filter(note => note.date !== selectedDate)
        );
        onToastMessage("Nota eliminada correctamente");
      } else {
        setDailyNotes(prevNotes => {
          const existingIndex = prevNotes.findIndex(note => note.date === selectedDate);
          if (existingIndex >= 0) {
            const updatedNotes = [...prevNotes];
            updatedNotes[existingIndex] = result;
            return updatedNotes;
          } else {
            return [...prevNotes, result];
          }
        });
        onToastMessage("Nota guardada correctamente");
      }
      
      setShowNoteModal(false);
      setNoteContent("");
    } catch (error) {
      console.error("Error guardando nota:", error);
      onToastMessage("Error al guardar la nota. Inténtalo de nuevo.");
    } finally {
      setIsSavingNote(false);
    }
  };

  // Funciones para drag & drop
  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.title);
    
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = '0.5';
    dragElement.style.transform = 'rotate(5deg) scale(0.95)';
  };

  const handleTaskDragEnd = (e: React.DragEvent) => {
    const dragElement = e.currentTarget as HTMLElement;
    dragElement.style.opacity = '1';
    dragElement.style.transform = 'none';
    
    setDraggedTask(null);
    setDragOverDate(null);
  };

  const handleDayDragOver = (e: React.DragEvent, date: Date, formatDateForNote: (date: Date) => string) => {
    if (!draggedTask) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const dateString = formatDateForNote(date);
    setDragOverDate(dateString);
  };

  const handleDayDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDate(null);
    }
  };

  const handleDayDrop = async (e: React.DragEvent, date: Date, formatDateForNote: (date: Date) => string) => {
    e.preventDefault();
    setDragOverDate(null);
    
    if (!draggedTask) return;
    
    const newDateString = formatDateForNote(date);
    
    if (draggedTask.dueDate === newDateString) {
      setDraggedTask(null);
      return;
    }

    try {
      const updatedTask = await updateTask(draggedTask.id, { 
        dueDate: newDateString
      });
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === draggedTask.id ? updatedTask : task
        )
      );

      const formatDisplayDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      };

      onToastMessage(
        `📅 "${draggedTask.title}" movida a ${formatDisplayDate(newDateString)}`
      );
      
    } catch (error) {
      console.error('Error actualizando fecha de tarea:', error);
      onToastMessage('⚠ Error al mover la tarea. Inténtalo de nuevo.');
      loadTasks();
    } finally {
      setDraggedTask(null);
    }
  };

  return {
    // Estados
    tasks,
    proyectos,
    selectedTaskForDetails, setSelectedTaskForDetails,
    currentDate,
    dailyNotes,
    showNoteModal, setShowNoteModal,
    selectedDate,
    noteContent, setNoteContent,
    isLoadingNotes,
    isSavingNote,
    draggedTask,
    dragOverDate,
    highlightedTask,
    
    // Funciones de navegación
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    isCurrentMonth,
    
    // Funciones auxiliares
    getProjectName,
    shouldHighlightTask,
    isDayBetweenTask,
    getNoteForDate,
    
    // Event handlers
    handleTaskSingleClick,
    handleTaskDoubleClick,
    handleDayClick,
    saveNote,
    handleTaskDragStart,
    handleTaskDragEnd,
    handleDayDragOver,
    handleDayDragLeave,
    handleDayDrop,
    
    // Funciones de recarga
    loadTasks
  };
};