import React from "react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { useCalendarLogic } from "../hooks/useCalendarLogic";
import { useCalendarDates } from "../hooks/useCalendarDates";
import { CalendarNavigation } from "../components/CalendarNavigation";
import { CalendarDay } from "../components/CalendarDay";
import { DailyNoteModal } from "../components/DailyNoteModal";
import { CalendarLegend } from "../components/CalendarLegend";
import TaskDetailsModal from "../components/TaskDetailModal";

interface BotonCalendarioProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean;
}

const BotonCalendario: React.FC<BotonCalendarioProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false,
}) => {
  // Función auxiliar mejorada para formatear fechas de forma consistente
  const toLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  // Función CORREGIDA para calcular el segmento del rango
  const computeRangeSegment = (date: Date): 'none' | 'past' | 'today' | 'future' => {
    const ht = calendarLogic.highlightedTask;
    if (!ht || !ht.createdAt || !ht.dueDate) {
      return 'none';
    }

    const dayStr = toLocalYMD(date);
    const todayStr = toLocalYMD(new Date());
    
    // Usar la misma función de normalización que en isDayBetweenTask
    let createdStr: string;
    if (typeof ht.createdAt === 'string') {
      if (ht.createdAt.includes('T')) {
        createdStr = toLocalYMD(new Date(ht.createdAt));
      } else {
        createdStr = ht.createdAt;
      }
    } else {
      createdStr = toLocalYMD(new Date(ht.createdAt));
    }
    
    const dueStr = ht.dueDate;

    // IMPORTANT: Primero verificar si está en el rango
    const isInRange = dayStr >= createdStr && dayStr <= dueStr;
    


    // Si NO está en el rango, retornar 'none'
    if (!isInRange) {
      return 'none';
    }
    
    // Si está en el rango, calcular el segmento
    if (dayStr < todayStr) return 'past';
    if (dayStr > todayStr) return 'future';
    return 'today';
  };

  const calendarLogic = useCalendarLogic({ isActive, onToastMessage });
  const { 
    getCurrentMonthDates, 
    formatMonthYear, 
    formatDateForNote,
    formatDateForDisplay,
    getTasksForDate,
    getTasksCreatedOnDate
  } = useCalendarDates(calendarLogic.currentDate);

 
  // Función para renderizar el calendario
  const renderCalendar = () => {
    const { dates, currentMonth, currentYear } = getCurrentMonthDates();
    
    return (
      <>
        <h3 className="text-4xl font-bold text-green-700 text-center mb-6">
          📅 Calendario de Tareas
        </h3>

        <div className="max-w-4xl mx-auto">
          {/* Navegación del mes */}
          <CalendarNavigation
            monthYear={formatMonthYear(currentMonth, currentYear)}
            isCurrentMonth={calendarLogic.isCurrentMonth()}
            onPrevious={calendarLogic.goToPreviousMonth}
            onNext={calendarLogic.goToNextMonth}
            onToday={calendarLogic.goToCurrentMonth}
          />

          

          {/* Indicador de carga de notas */}
          {calendarLogic.isLoadingNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm text-blue-700">
                ⏳ Cargando notas del mes...
              </p>
            </div>
          )}

          {/* Instrucciones de uso */}
          {!calendarLogic.isLoadingNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-center space-y-2">
              <p className="text-sm text-blue-700">
                💡 <strong>Arrastra las tareas 🎯</strong> entre días para cambiar su fecha de vencimiento
              </p>
              <p className="text-sm text-blue-600">
                ✨ <strong>1 click:</strong> Resalta la tarea | <strong>2 clicks:</strong> Ver detalles
              </p>
            </div>
          )}

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div
                key={day}
                className="p-2 text-center font-semibold text-gray-600 bg-gray-100 rounded"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {dates.map((date, index) => {
              // claves y checks básicos
              const dayKey = formatDateForNote(date);
              const isInCurrentMonth =
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear;

              const isToday =
                formatDateForNote(date) === formatDateForNote(new Date());

              // datos por día
              const tasksCreated = getTasksCreatedOnDate(calendarLogic.tasks, date);
              const tasksWithDeadline = getTasksForDate(calendarLogic.tasks, date);
              const hasNote = calendarLogic.getNoteForDate(dayKey);

              // drag & drop
              const isDragOver = calendarLogic.dragOverDate === dayKey;
              const draggedTask = calendarLogic.draggedTask;

              // pintado de rango y segmento
              const isBetweenHighlightedTask = calendarLogic.isDayBetweenTask(date);
              const rangeSegment = computeRangeSegment(date);

             

              return (
                <CalendarDay
                  key={dayKey} 
                  date={date}
                  isCurrentMonth={isInCurrentMonth}
                  isToday={isToday}
                  tasksCreated={tasksCreated}
                  tasksWithDeadline={tasksWithDeadline}
                  hasNote={hasNote}
                  isDragOver={isDragOver}
                  draggedTask={draggedTask}
                  isBetweenHighlightedTask={isBetweenHighlightedTask}
                  rangeSegment={rangeSegment}
                  // Handlers (envolvemos para pasar formatDateForNote cuando lo pide el hook)
                  onDayClick={(d, e) => calendarLogic.handleDayClick(d, e, formatDateForNote)}
                  onDragOver={(e) => calendarLogic.handleDayDragOver(e, date, formatDateForNote)}
                  onDragLeave={(e) => calendarLogic.handleDayDragLeave(e)}
                  onDrop={(e) => calendarLogic.handleDayDrop(e, date, formatDateForNote)}
                  onTaskSingleClick={calendarLogic.handleTaskSingleClick}
                  onTaskDoubleClick={calendarLogic.handleTaskDoubleClick}
                  onTaskDragStart={calendarLogic.handleTaskDragStart}
                  onTaskDragEnd={calendarLogic.handleTaskDragEnd}
                  shouldHighlightTask={calendarLogic.shouldHighlightTask}
                />
              );
            })}
          </div>

          {/* Leyenda */}
          <CalendarLegend />

          {/* Modal de notas diarias */}
          <DailyNoteModal
            isOpen={calendarLogic.showNoteModal}
            selectedDate={calendarLogic.selectedDate}
            noteContent={calendarLogic.noteContent}
            isSaving={calendarLogic.isSavingNote}
            onClose={() => calendarLogic.setShowNoteModal(false)}
            onContentChange={calendarLogic.setNoteContent}
            onSave={calendarLogic.saveNote}
            formatDateForDisplay={formatDateForDisplay}
          />
        </div>

        {/* Modal de detalles de tarea */}
        {calendarLogic.selectedTaskForDetails && (
          <TaskDetailsModal
            task={calendarLogic.selectedTaskForDetails}
            projectName={calendarLogic.getProjectName(calendarLogic.selectedTaskForDetails.projectId)}
            onClose={() => calendarLogic.setSelectedTaskForDetails(null)}
            onEdit={() => {
              calendarLogic.setSelectedTaskForDetails(null);
              onToastMessage("Para editar, ve a la sección de Tareas");
            }}
          />
        )}
      </>
    );
  };

  // Si onlyContent es true, renderizar solo el contenido
  if (onlyContent) {
    return renderCalendar();
  }

  // Si no está activo, solo renderizar el botón de navegación
  if (!isActive) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-green-400 hover:bg-green-500 shadow-lg text-white text-sm transition-all duration-200"
        >
          <CalendarDaysIcon className="w-7 h-7 mb-1" />
          <span className="font-medium">Calendario</span>
        </button>
      </div>
    );
  }

  // Vista completa cuando está activo
  return (
    <>
      {/* Botón de navegación activo */}
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-green-400 hover:bg-green-500 shadow-lg text-white text-sm transition-all duration-200 relative z-10 ring-4 ring-offset-2 ring-green-200 shadow-green-200/70 shadow-xl"
          style={{ transform: "scale(1.2)" }}
        >
          <CalendarDaysIcon className="w-9 h-9 mb-1" />
          <span className="font-medium">Calendario</span>
        </button>
      </div>

      {/* Vista de contenido completo */}
      <div className="mt-10 relative">
        <div className="min-h-96">
          <div className="relative">
            {renderCalendar()}
          </div>
        </div>
      </div>
    </>
  );
};

export default BotonCalendario;