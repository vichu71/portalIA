// hooks/useCalendarDates.ts
export const useCalendarDates = (currentDate: Date) => {
  const getCurrentMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Convertir domingo=0 a domingo=6
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const dates = [];
    const currentDateIter = new Date(startDate);

    // Generar 42 días (6 semanas) para mostrar calendario completo
    for (let i = 0; i < 42; i++) {
      dates.push(new Date(currentDateIter));
      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    return { dates, currentMonth: month, currentYear: year };
  };

  const formatMonthYear = (month: number, year: number) => {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];
    return `${monthNames[month]} ${year}`;
  };

  const formatDateForNote = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  // FUNCIÓN AUXILIAR: Normalizar fecha a formato YYYY-MM-DD
  const normalizeDate = (dateInput: string | Date | undefined): string | null => {
    if (!dateInput) return null;
    
    try {
      if (dateInput instanceof Date) {
        return formatDateForNote(dateInput);
      }
      
      if (typeof dateInput === 'string') {
        // Si ya está en formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          return dateInput;
        }
        // Si está en formato ISO (con timestamp)
        if (dateInput.includes('T')) {
          return formatDateForNote(new Date(dateInput));
        }
        // Intentar parsear como fecha
        const parsedDate = new Date(dateInput);
        if (!isNaN(parsedDate.getTime())) {
          return formatDateForNote(parsedDate);
        }
      }
    } catch (error) {
      console.warn('Error normalizando fecha:', dateInput, error);
    }
    
    return null;
  };

  // ACTUALIZADA: Buscar tareas con fecha límite en un día específico
  const getTasksForDate = (tasks: any[], date: Date) => {
    const targetDateString = formatDateForNote(date);
    
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const normalizedDueDate = normalizeDate(task.dueDate);
      return normalizedDueDate === targetDateString;
    });
  };

  // ACTUALIZADA: Buscar tareas que INICIAN en un día específico (usando startDate con fallback)
  const getTasksCreatedOnDate = (tasks: any[], date: Date) => {
    const targetDateString = formatDateForNote(date);
    
    return tasks.filter((task) => {
      // Prioridad: startDate > createdAt > null
      let taskStartDate: string | null = null;
      
      if (task.startDate) {
        taskStartDate = normalizeDate(task.startDate);
      } else if (task.createdAt) {
        taskStartDate = normalizeDate(task.createdAt);
      }
      
      return taskStartDate === targetDateString;
    });
  };

  // NUEVA: Obtener fecha efectiva de inicio de una tarea
  const getEffectiveStartDate = (task: any): string | null => {
    if (task.startDate) {
      return normalizeDate(task.startDate);
    }
    if (task.createdAt) {
      return normalizeDate(task.createdAt);
    }
    return null;
  };

  // NUEVA: Verificar si una tarea tiene rango de fechas válido
  const hasValidDateRange = (task: any): boolean => {
    const startDate = getEffectiveStartDate(task);
    const endDate = normalizeDate(task.dueDate);
    return !!(startDate && endDate);
  };

  // NUEVA: Verificar si una fecha está en el rango de una tarea
  const isDateInTaskRange = (date: Date, task: any): boolean => {
    if (!hasValidDateRange(task)) return false;
    
    const dateString = formatDateForNote(date);
    const startDate = getEffectiveStartDate(task);
    const endDate = normalizeDate(task.dueDate);
    
    return dateString >= startDate! && dateString <= endDate!;
  };

  return {
    getCurrentMonthDates,
    formatMonthYear,
    formatDateForNote,
    formatDateForDisplay,
    getTasksForDate,
    getTasksCreatedOnDate,
    
    // Nuevas funciones para manejar startDate
    normalizeDate,
    getEffectiveStartDate,
    hasValidDateRange,
    isDateInTaskRange
  };
};