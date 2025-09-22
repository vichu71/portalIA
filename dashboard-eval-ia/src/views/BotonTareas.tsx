import React, { useState, useEffect } from "react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { MoreVertical, Pencil, Trash2, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { getTasks, Task, deleteTask, updateTask } from "../services/taskService";
import { getProjects, Project } from "../services/projectService";
import TaskEditorModal from "../components/TaskEditorModal";
import TaskDetailsModal from "../components/TaskDetailModal";
import ConfirmModal from "../components/ConfirmModal";

interface BotonTareasProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean; // Nueva prop para renderizar solo contenido
}

const BotonTareas: React.FC<BotonTareasProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false, // Valor por defecto
}) => {
  // Estados locales
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [busquedaTarea, setBusquedaTarea] = useState("");
  const [filtroProyecto, setFiltroProyecto] = useState<string>(""); // Nuevo estado para filtro de proyecto
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>(""); // Nuevo estado para filtro de prioridad
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Estados adicionales para drag & drop
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Cargar datos cuando el componente se monta o cuando cambia la búsqueda
  useEffect(() => {
    if (isActive) {
      loadTasks(busquedaTarea);
      loadProjects(); // Necesario para getProjectName
    }
  }, [isActive, busquedaTarea]);

  // Funciones de carga
  const loadTasks = (title: string = "") => {
    getTasks(title)
      .then(setTasks)
      .catch((err) => console.error("Error cargando tareas:", err));
  };

  const loadProjects = () => {
    getProjects()
      .then(setProyectos)
      .catch((err) => console.error("Error cargando proyectos:", err));
  };

  // Función para aplicar todos los filtros
  const applyFilters = (tasksToFilter: Task[]) => {
    return tasksToFilter.filter(task => {
      // Filtro por texto
      const matchesText = task.title.toLowerCase().includes(busquedaTarea.toLowerCase()) ||
                          task.description?.toLowerCase().includes(busquedaTarea.toLowerCase());
      
      // Filtro por proyecto
      const matchesProject = filtroProyecto === "" || 
                            (filtroProyecto === "sin-proyecto" ? !task.projectId : task.projectId?.toString() === filtroProyecto);
      
      // Filtro por prioridad
      const matchesPriority = filtroPrioridad === "" || task.priority === filtroPrioridad;
      
      return matchesText && matchesProject && matchesPriority;
    });
  };

  // Funciones auxiliares
  const getProjectName = (projectId: number | undefined) => {
    if (!projectId) return null;
    const project = proyectos.find((p) => p.id === projectId);
    return project ? project.name : `Proyecto #${projectId}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-100 text-red-800";
      case "media":
        return "bg-yellow-100 text-yellow-800";
      case "baja":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completada":
        return "bg-green-100 text-green-800";
      case "en_progreso":
        return "bg-blue-100 text-blue-800";
      case "pendiente":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener el color de prioridad para círculos
  const getPrioritySelectColor = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-red-500";
      case "media":
        return "bg-yellow-500";
      case "baja":
        return "bg-green-500";
      default:
        return "bg-purple-400";
    }
  };

  // Función para obtener el emoji de prioridad
  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case "alta":
        return "🔴";
      case "media":
        return "🟡";
      case "baja":
        return "🟢";
      default:
        return "🔄";
    }
  };

  // Función para generar color único por proyecto
  const getProjectColor = (projectName: string) => {
    if (!projectName) return "bg-gray-400";
    
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", 
      "bg-pink-500", "bg-indigo-500", "bg-red-500", "bg-teal-500",
      "bg-orange-500", "bg-cyan-500", "bg-lime-500", "bg-amber-500"
    ];
    
    // Simple hash function para asignar color consistente
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    setBusquedaTarea("");
    setFiltroProyecto("");
    setFiltroPrioridad("");
  };

  // Handlers
  const handleDeleteTask = (taskId: number) => {
    setSelectedTaskId(taskId);
    setShowConfirmModal(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTaskForDetails(task);
  };

  const confirmDeleteTask = async () => {
    if (!selectedTaskId) return;
    try {
      await deleteTask(selectedTaskId);
      onToastMessage("Tarea eliminada correctamente");
      loadTasks(busquedaTarea);
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      if (error instanceof Error) {
        onToastMessage("⚠️ " + error.message);
      } else {
        onToastMessage("⚠️ Error al eliminar tarea");
      }
    } finally {
      setShowConfirmModal(false);
      setSelectedTaskId(null);
    }
  };

  const handleTaskSuccess = () => {
    loadTasks(busquedaTarea);
    setCreatingTask(false);
    setEditingTaskId(null);
    onToastMessage("Tarea guardada correctamente");
  };

  // Funciones para drag & drop
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      // Actualizar en la API primero
      const updatedTask = await updateTask(draggedTask.id, { 
        status: newStatus as "pendiente" | "en_progreso" | "completada"
      });
      
      // Si la API responde correctamente, actualizar la lista local
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === draggedTask.id ? updatedTask : task
        )
      );

      onToastMessage(`Tarea "${draggedTask.title}" movida a ${
        newStatus === 'pendiente' ? 'Pendientes' :
        newStatus === 'en_progreso' ? 'En Curso' : 'Realizadas'
      }`);
      
    } catch (error) {
      console.error('Error actualizando estado de tarea:', error);
      onToastMessage('Error al mover la tarea. Por favor, inténtalo de nuevo.');
      
      // Opcional: recargar tareas desde el servidor en caso de error
      loadTasks(busquedaTarea);
    } finally {
      setDraggedTask(null);
    }
  };

  // Componente de filtros
  const FiltersSection = () => (
    <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-md border-2 border-gray-100 mb-6">
      <div className="flex flex-col gap-4">
        {/* Primera fila: Búsqueda por texto */}
        <div className="flex items-center gap-4">
          <Filter className="w-6 h-6 text-purple-500" />
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por título o descripción..."
              value={busquedaTarea}
              onChange={(e) => setBusquedaTarea(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Segunda fila: Filtros por combos */}
        {/* Segunda fila: Filtros por combos + botón alineado */}
<div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6">

  {/* PROYECTO (fila 1, col 1) */}
  <div className="lg:row-start-1 lg:col-start-1">
    <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">
      📁 PROYECTO
    </label>
    <div className="relative">
      {/* Indicador visual */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-4 h-4 rounded-full ${
            filtroProyecto === "" ? "bg-purple-400" :
            filtroProyecto === "sin-proyecto" ? "bg-gray-400" :
            getProjectColor(proyectos.find(p => p.id.toString() === filtroProyecto)?.name || "")
          } border-2 border-white shadow-md`}
        ></div>
        <span className="text-sm font-medium text-gray-700">
          {filtroProyecto === "" ? "Todos los proyectos" :
          filtroProyecto === "sin-proyecto" ? "Sin proyecto asignado" :
          proyectos.find(p => p.id.toString() === filtroProyecto)?.name || "Proyecto desconocido"}
        </span>
      </div>

      <select
        value={filtroProyecto}
        onChange={(e) => setFiltroProyecto(e.target.value)}
        className="w-full h-[48px] p-3 pl-12 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium bg-gradient-to-r from-white to-gray-50 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 12px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '16px'
        }}
      >
        <option value="">🔄 Todos los proyectos</option>
        <option value="sin-proyecto">❌ Sin proyecto asignado</option>
        {proyectos.map((proyecto) => (
          <option key={proyecto.id} value={proyecto.id.toString()}>
            📂 {proyecto.name}
          </option>
        ))}
      </select>

      {/* Icono carpeta */}
      <div className="absolute left-4 top-[52px] -translate-y-1/2 pointer-events-none">
        <span className="text-gray-400 text-lg">📁</span>
      </div>
    </div>
  </div>

  {/* PRIORIDAD (fila 1, col 2) */}
  <div className="lg:row-start-1 lg:col-start-2">
    <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">
      🎯 PRIORIDAD
    </label>
    <div className="relative">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-4 h-4 rounded-full ${getPrioritySelectColor(filtroPrioridad)} border-2 border-white shadow-md flex items-center justify-center`}>
          <span className="text-xs">{getPriorityEmoji(filtroPrioridad)}</span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {filtroPrioridad === "" ? "Todas las prioridades" :
          filtroPrioridad === "alta" ? "Prioridad Alta" :
          filtroPrioridad === "media" ? "Prioridad Media" :
          filtroPrioridad === "baja" ? "Prioridad Baja" : "Todas las prioridades"}
        </span>
      </div>

      <select
        value={filtroPrioridad}
        onChange={(e) => setFiltroPrioridad(e.target.value)}
        className="w-full h-[48px] p-3 pl-12 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium bg-gradient-to-r from-white to-gray-50 appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 12px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '16px'
        }}
      >
        <option value="">🔄 Todas las prioridades</option>
        <option value="alta">🔴 Prioridad Alta</option>
        <option value="media">🟡 Prioridad Media</option>
        <option value="baja">🟢 Prioridad Baja</option>
      </select>

      {/* Icono diana */}
      <div className="absolute left-4 top-[52px] -translate-y-1/2 pointer-events-none">
        <span className="text-gray-400 text-lg">🎯</span>
      </div>
    </div>
  </div>

  {/* ACCIÓN (fila 1, col 3) → botón alineado con los selects */}
  <div className="lg:row-start-1 lg:col-start-3 lg:self-end">
    <button
      onClick={clearFilters}
      className="w-full lg:w-auto px-6 py-3 h-[48px] bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-bold rounded-xl border-2 border-gray-300 transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center justify-center gap-2"
      title="Limpiar todos los filtros"
    >
      <span className="text-lg">🧹</span>
      <span className="text-sm tracking-wide">LIMPIAR</span>
    </button>
  </div>

  {/* PREVIEWS (fila 2) — ya no afectan a la alineación del botón */}
  <div className="lg:row-start-2 lg:col-start-1">
    {proyectos.length > 0 && (
      <div className="mt-1 flex flex-wrap gap-2">
        {proyectos.slice(0, 6).map((proyecto) => (
          <div key={`preview-${proyecto.id}`} className="flex items-center gap-1 text-xs text-gray-600">
            <div className={`w-2 h-2 rounded-full ${getProjectColor(proyecto.name)}`}></div>
            <span className="truncate max-w-20">{proyecto.name}</span>
          </div>
        ))}
        {proyectos.length > 6 && (
          <div className="text-xs text-gray-500">+{proyectos.length - 6} más...</div>
        )}
      </div>
    )}
  </div>

  <div className="lg:row-start-2 lg:col-start-2">
    <div className="mt-1 flex flex-wrap gap-3">
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <div className="w-2 h-2 rounded-full bg-purple-400 flex items-center justify-center">
          <span style={{ fontSize: '6px' }}>🔄</span>
        </div>
        <span>Todas</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <div className="w-2 h-2 rounded-full bg-red-500 flex items-center justify-center">
          <span style={{ fontSize: '6px' }}>🔴</span>
        </div>
        <span>Alta</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <div className="w-2 h-2 rounded-full bg-yellow-500 flex items-center justify-center">
          <span style={{ fontSize: '6px' }}>🟡</span>
        </div>
        <span>Media</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <div className="w-2 h-2 rounded-full bg-green-500 flex items-center justify-center">
          <span style={{ fontSize: '6px' }}>🟢</span>
        </div>
        <span>Baja</span>
      </div>
    </div>
  </div>

</div>

      </div>
    </div>
  );

  // Si onlyContent es true, renderizar solo el contenido
  if (onlyContent) {
    // Aplicar filtros a todas las tareas
    const filteredTasks = applyFilters(tasks);

    // Agrupar tareas filtradas por estado para las 3 columnas
    const tasksByStatus = {
      pendiente: filteredTasks.filter(task => task.status === 'pendiente'),
      en_progreso: filteredTasks.filter(task => task.status === 'en_progreso'),  
      completada: filteredTasks.filter(task => task.status === 'completada')
    };

    const columns = [
      {
        id: 'pendiente',
        title: '📋 Pendientes',
        tasks: tasksByStatus.pendiente,
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      },
      {
        id: 'en_progreso', 
        title: '🔄 En Curso',
        tasks: tasksByStatus.en_progreso,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      {
        id: 'completada',
        title: '✅ Realizadas', 
        tasks: tasksByStatus.completada,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    ];

    return (
      <>
        <h3 className="text-4xl font-bold text-purple-700 text-center mb-4">
          📋 Gestión de Tareas
        </h3>
        
        {/* Sección de filtros */}
        <div className="max-w-7xl mx-auto mb-6">
          <FiltersSection />
        </div>

        {/* Vista Kanban de 3 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {columns.map((column) => (
            <div 
              key={column.id} 
              className={`${column.bgColor} rounded-xl p-4 border-2 ${column.borderColor} min-h-96 transition-all ${
                dragOverColumn === column.id ? 'ring-2 ring-purple-400 ring-offset-2 scale-[1.02]' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Header de la columna */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  {column.title}
                </h4>
                <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
                  {column.tasks.length}
                </span>
              </div>

              {/* Tareas de la columna */}
              <div className="space-y-3">
                {column.tasks.length === 0 ? (
                  <div className={`text-gray-500 text-center py-8 italic rounded-lg border-2 border-dashed border-gray-300 ${
                    dragOverColumn === column.id ? 'border-purple-400 bg-purple-50' : ''
                  }`}>
                    {dragOverColumn === column.id ? 
                      '🔥 Suelta aquí para mover' : 
                      `No hay tareas ${column.id === 'pendiente' ? 'pendientes' : 
                                    column.id === 'en_progreso' ? 'en curso' : 'completadas'}`
                    }
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className={`bg-white hover:bg-purple-50 transition rounded-lg p-4 shadow-sm border border-gray-200 relative cursor-grab active:cursor-grabbing ${
                        draggedTask?.id === task.id ? 'opacity-50 rotate-1 scale-95' : 'hover:shadow-md'
                      }`}
                      onClick={() => draggedTask ? null : handleTaskClick(task)}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button 
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTaskId(task.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Indicador de arrastre */}
                      <div className="absolute top-2 left-2 text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>

                      <h5 className="font-semibold text-gray-800 mb-2 pr-6 pl-6">
                        {task.title}
                      </h5>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 pl-6">
                          {task.description}
                        </p>
                      )}

                      {task.projectId && (
                        <p className="text-sm font-medium text-gray-700 mb-2 pl-6 flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getProjectColor(getProjectName(task.projectId) || "")} border border-white shadow-sm`}></div>
                          📁 {getProjectName(task.projectId)}
                        </p>
                      )}
                      
                      {task.assignedTo && (
                        <p className="text-sm text-gray-500 mb-2 pl-6">
                          👤 {task.assignedTo}
                        </p>
                      )}
                      
                      {task.dueDate && (
                        <p className="text-sm text-gray-500 mb-2 pl-6">
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}

                      {/* Badge de prioridad con círculo de color */}
                      <div className="flex justify-start pl-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getPrioritySelectColor(task.priority)} border border-white shadow-sm flex items-center justify-center`}>
                            <span style={{fontSize: '8px'}}>{getPriorityEmoji(task.priority)}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setCreatingTask(true)}
          className="fixed bottom-8 right-8 bg-purple-400 hover:bg-purple-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
          title="Añadir Tarea"
        >
          <ClipboardDocumentListIcon className="w-6 h-6" />
        </button>

        {/* Modales */}
        {(creatingTask || editingTaskId !== null) && (
          <TaskEditorModal
            taskId={editingTaskId ?? undefined}
            onClose={() => {
              setCreatingTask(false);
              setEditingTaskId(null);
            }}
            onSuccess={handleTaskSuccess}
          />
        )}

        <ConfirmModal
          open={showConfirmModal}
          title="Eliminar tarea"
          message="¿Estás seguro de que deseas eliminar esta tarea?"
          onConfirm={confirmDeleteTask}
          onCancel={() => {
            setShowConfirmModal(false);
            setSelectedTaskId(null);
          }}
        />

        {selectedTaskForDetails && (
          <TaskDetailsModal
            task={selectedTaskForDetails}
            projectName={getProjectName(selectedTaskForDetails.projectId)}
            onClose={() => setSelectedTaskForDetails(null)}
            onEdit={() => {
              setEditingTaskId(selectedTaskForDetails.id);
              setSelectedTaskForDetails(null);
            }}
          />
        )}
      </>
    );
  }

  // Si no está activo, solo renderizar el botón de navegación
  if (!isActive) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-purple-400 hover:bg-purple-500 shadow-lg text-white text-sm transition-all duration-200"
        >
          <ClipboardDocumentListIcon className="w-7 h-7 mb-1" />
          <span className="font-medium">Tareas</span>
        </button>
      </div>
    );
  }

  // Vista completa cuando está activo (vista de lista)
  const filteredTasks = applyFilters(tasks);

  return (
    <>
      {/* Botón de navegación activo */}
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-purple-400 hover:bg-purple-500 shadow-lg text-white text-sm transition-all duration-200 relative z-10 ring-4 ring-offset-2 ring-purple-200 shadow-purple-200/70 shadow-xl"
          style={{ transform: "scale(1.2)" }}
        >
          <ClipboardDocumentListIcon className="w-9 h-9 mb-1" />
          <span className="font-medium">Tareas</span>
        </button>
      </div>

      {/* Vista de contenido */}
      <div className="mt-10 relative">
        <div className="min-h-96">
          <div className="relative">
            <h3 className="text-4xl font-bold text-purple-700 text-center mb-4">
              ✅ Lista de Tareas Pendientes
            </h3>
            
            {/* Sección de filtros para la vista de lista */}
            <div className="max-w-xl mx-auto mb-6">
              <FiltersSection />
            </div>

            <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
              {filteredTasks.length === 0 ? (
                <p className="text-gray-500 text-center italic">
                  {tasks.length === 0 ? "No hay tareas registradas aún." : "No se encontraron tareas con los filtros aplicados."}
                </p>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white hover:bg-purple-50 transition rounded-xl px-5 py-4 shadow border border-gray-200 relative cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTaskId(task.id);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <h3 className="text-lg font-semibold text-gray-800">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {task.description}
                    </p>
                    {task.projectId && (
                      <p className="text-base font-bold text-gray-700 mt-2 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getProjectColor(getProjectName(task.projectId) || "")} border border-white shadow-sm`}></div>
                        Proyecto: {getProjectName(task.projectId)}
                      </p>
                    )}
                    {task.assignedTo && (
                      <p className="text-sm text-gray-500 mt-1">
                        Asignado a: {task.assignedTo}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="text-sm text-gray-500 mt-1">
                        Fecha límite:{" "}
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <div className={`w-3 h-3 rounded-full ${getPrioritySelectColor(task.priority)} border border-white shadow-sm flex items-center justify-center`}>
                            <span style={{fontSize: '8px'}}>{getPriorityEmoji(task.priority)}</span>
                          </div>
                          <span className={`text-sm px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <span
                          className={`text-sm px-3 py-1 rounded-full ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setCreatingTask(true)}
              className="fixed bottom-8 right-8 bg-purple-400 hover:bg-purple-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
              title="Añadir Tarea"
            >
              <ClipboardDocumentListIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      {(creatingTask || editingTaskId !== null) && (
        <TaskEditorModal
          taskId={editingTaskId ?? undefined}
          onClose={() => {
            setCreatingTask(false);
            setEditingTaskId(null);
          }}
          onSuccess={handleTaskSuccess}
        />
      )}

      <ConfirmModal
        open={showConfirmModal}
        title="Eliminar tarea"
        message="¿Estás seguro de que deseas eliminar esta tarea?"
        onConfirm={confirmDeleteTask}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedTaskId(null);
        }}
      />

      {selectedTaskForDetails && (
        <TaskDetailsModal
          task={selectedTaskForDetails}
          projectName={getProjectName(selectedTaskForDetails.projectId)}
          onClose={() => setSelectedTaskForDetails(null)}
          onEdit={() => {
            setEditingTaskId(selectedTaskForDetails.id);
            setSelectedTaskForDetails(null);
          }}
        />
      )}
    </>
  );
};

export default BotonTareas;