import React, { useEffect, useState } from "react";
import { 
  ClipboardDocumentListIcon, 
  DocumentIcon, 
  ComputerDesktopIcon, 
  CalendarDaysIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";
import Toast from "../components/Toast";
import BotonProyectos from "./BotonProyectos";
import BotonServidores from "./BotonServidores";
import BotonTareas from "./BotonTareas";
import BotonCalendario from "./BotonCalendario";
import BotonDashboardNotas from "./BotonDashboardNotas";
import { Task } from "../services/taskService"; // ✨ Import necesario para la integración

const VistaProyectos: React.FC = () => {
  // Estados mínimos para navegación y UI global
  const [activeCategory, setActiveCategory] = useState<
    | "project"
    | "environment"
    | "server"
    | "task"
    | "calendar"
    | "dashboard"
    | null
  >("project");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // ✨ NUEVO: Estado para la integración calendario-tareas
  const [calendarTask, setCalendarTask] = useState<Task | null>(null);

  // Auto-ocultar toast después de 3 segundos
  useEffect(() => {
    if (toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toastMessage]);

  // ✨ NUEVO: Handler para abrir calendario desde tareas
  const handleOpenCalendarFromTask = (task: Task) => {
    // Establecer la tarea que debe destacarse
    setCalendarTask(task);
    
    // Cambiar al módulo de calendario
    setActiveCategory('calendar');
    
    // Mensaje informativo
    const hasRange = task.createdAt && task.dueDate;
    setToastMessage(
      hasRange 
        ? `📅 Mostrando rango de "${task.title}" en calendario`
        : `📅 Mostrando "${task.title}" en calendario`
    );
  };

  // ✨ NUEVO: Handler para limpiar la tarea destacada
  const handleClearHighlightedTask = () => {
    setCalendarTask(null);
  };

  // ✨ MEJORADO: Handler para cambio de categoría que limpia destacado si es necesario
  const handleCategoryChange = (category: typeof activeCategory) => {
    setActiveCategory(category);
    
    // Limpiar tarea destacada si no vamos al calendario
    if (category !== 'calendar') {
      setCalendarTask(null);
    }
  };

  // Botones de navegación simplificados
  const NavButton = ({ category, icon: Icon, label, color, hoverColor, activeColor }: any) => (
    <div className="relative">
      <button
        onClick={() => handleCategoryChange(category)} // ✨ Usar handler mejorado
        className={`w-24 h-24 flex flex-col items-center justify-center rounded-xl shadow-lg text-white text-sm transition-all duration-200 ${
          activeCategory === category
            ? `${activeColor} relative z-10 ring-4 ring-offset-2 shadow-xl scale-110`
            : `${color} hover:${hoverColor}`
        }`}
      >
        <Icon className={activeCategory === category ? "w-9 h-9 mb-1" : "w-7 h-7 mb-1"} />
        <span className="font-medium text-xs">{label}</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {toastMessage && <Toast message={toastMessage} />}

      {/* Header fijo con navegación */}
      <div className="sticky top-0 z-50 bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-center">
            <div className="flex gap-5 justify-center flex-wrap">
              <NavButton 
                category="project"
                icon={DocumentIcon}
                label="Proyectos"
                color="bg-cyan-400"
                hoverColor="bg-cyan-500"
                activeColor="bg-cyan-500 ring-cyan-200"
              />
              <NavButton 
                category="server"
                icon={ComputerDesktopIcon}
                label="Servidores"
                color="bg-orange-400"
                hoverColor="bg-orange-500"
                activeColor="bg-orange-500 ring-orange-200"
              />
              <NavButton 
                category="task"
                icon={ClipboardDocumentListIcon}
                label="Tareas"
                color="bg-purple-400"
                hoverColor="bg-purple-500"
                activeColor="bg-purple-500 ring-purple-200"
              />
              <NavButton 
                category="calendar"
                icon={CalendarDaysIcon}
                label="Calendario"
                color="bg-green-400"
                hoverColor="bg-green-500"
                activeColor="bg-green-500 ring-green-200"
              />
              <NavButton 
                category="dashboard"
                icon={ChartBarIcon}
                label="Dashboard"
                color="bg-blue-400"
                hoverColor="bg-blue-500"
                activeColor="bg-blue-500 ring-blue-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal separado */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[600px]">
          
          {activeCategory === "project" && (
            <div className="p-6">
              <BotonProyectos
                isActive={true}
                onClick={() => handleCategoryChange("project")}
                onToastMessage={setToastMessage}
                onlyContent={true}
              />
            </div>
          )}

          {activeCategory === "server" && (
            <div className="p-6">
              <BotonServidores
                isActive={true}
                onClick={() => handleCategoryChange("server")}
                onToastMessage={setToastMessage}
                onlyContent={true}
              />
            </div>
          )}

          {activeCategory === "task" && (
            <div className="p-6">
              <BotonTareas
                isActive={true}
                onClick={() => handleCategoryChange("task")}
                onToastMessage={setToastMessage}
                onlyContent={true}
                onOpenCalendar={handleOpenCalendarFromTask} // ✨ CLAVE: Callback para integración
              />
            </div>
          )}

          {activeCategory === "calendar" && (
            <div className="p-6">
              <BotonCalendario
                isActive={true}
                onClick={() => handleCategoryChange("calendar")}
                onToastMessage={setToastMessage}
                onlyContent={true}
                highlightedTask={calendarTask} // ✨ CLAVE: Tarea a destacar
                onTaskDeselected={handleClearHighlightedTask} // ✨ CLAVE: Limpiar destacado
              />
            </div>
          )}

          {activeCategory === "dashboard" && (
            <div className="p-6">
              <BotonDashboardNotas
                isActive={true}
                onClick={() => handleCategoryChange("dashboard")}
                onToastMessage={setToastMessage}
                onlyContent={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VistaProyectos;