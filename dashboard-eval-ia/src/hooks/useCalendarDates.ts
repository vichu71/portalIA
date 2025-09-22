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

  const getTasksForDate = (tasks: any[], date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;
    return tasks.filter((task) => task.dueDate === dateString);
  };

  const getTasksCreatedOnDate = (tasks: any[], date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    return tasks.filter((task) => {
      if (!task.createdAt) return false;
      const createdDate = new Date(task.createdAt).toISOString().split("T")[0];
      return createdDate === dateString;
    });
  };

  return {
    getCurrentMonthDates,
    formatMonthYear,
    formatDateForNote,
    formatDateForDisplay,
    getTasksForDate,
    getTasksCreatedOnDate
  };
};