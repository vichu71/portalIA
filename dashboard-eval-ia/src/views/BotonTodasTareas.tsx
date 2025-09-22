import React, { useState, useEffect } from "react";
import { ClipboardDocumentListIcon, PlusIcon } from "@heroicons/react/24/outline";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { getTasks, Task, deleteTask } from "../services/taskService";
import { getProjects, Project } from "../services/projectService";
import TaskEditorModal from "../components/TaskEditorModal";
import TaskDetailsModal from "../components/TaskDetailModal";
import ConfirmModal from "../components/ConfirmModal";

interface BotonTodasTareasProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean; // Nueva prop para renderizar solo contenido
}

const BotonTodasTareas: React.FC<BotonTodasTareasProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false, // Valor por defecto
}) => {
  // Estados locales
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [groupBy, setGroupBy] = useState<"status" | "priority" | "project" | "dueDate">("status");
  const [filterBy, setFilterBy] = useState<"all" | "high" | "today" | "my-tasks">("all");
  const [searchAllTasks, setSearchAllTasks] = useState("");
  
  // Estados de modales y selección
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    if (isActive) {
      loadTasks();
      loadProjects();
    }
  }, [isActive]);

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

  const groupTasks = (tasks: Task[], groupBy: string) => {
    const grouped: { [key: string]: Task[] } = {};

    tasks.forEach((task) => {
      let key = "";
      switch (groupBy) {
        case "status":
          key =
            task.status === "pendiente"
              ? "Por hacer"
              : task.status === "en_progreso"
              ? "En progreso"
              : task.status === "completada"
              ? "Completadas"
              : "Otras";
          break;
        case "priority":
          key =
            task.priority === "alta"
              ? "Alta prioridad"
              : task.priority === "media"
              ? "Media prioridad"
              : task.priority === "baja"
              ? "Baja prioridad"
              : "Sin prioridad";
          break;
        case "project":
          key = task.projectId
            ? getProjectName(task.projectId) || "Proyecto desconocido"
            : "Sin proyecto";
          break;
        case "dueDate":
          if (!task.dueDate) {
            key = "Sin fecha límite";
          } else {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) key = "Vencidas";
            else if (diffDays === 0) key = "Vencen hoy";
            else if (diffDays <= 7) key = "Esta semana";
            else if (diffDays <= 30) key = "Este mes";
            else key = "Más adelante";
          }
          break;
        default:
          key = "Otras";
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });

    return grouped;
  };

  const filterTasks = (tasks: Task[], filter: string) => {
    switch (filter) {
      case "high":
        return tasks.filter((task) => task.priority === "alta");
      case "today":
        const today = new Date().toISOString().split("T")[0];
        return tasks.filter((task) => task.dueDate === today);
      case "my-tasks":
        return tasks.filter((task) => task.assignedTo);
      default:
        return tasks;
    }
  };

  const getGroupIcon = (groupKey: string, groupBy: string) => {
    switch (groupBy) {
      case "status":
        if (groupKey.includes("hacer")) return "📋";
        if (groupKey.includes("progreso")) return "🔄";
        if (groupKey.includes("Completadas")) return "✅";
        return "❓";
      case "priority":
        if (groupKey.includes("Alta")) return "🔴";
        if (groupKey.includes("Media")) return "🟡";
        if (groupKey.includes("Baja")) return "🟢";
        return "⚪";
      case "project":
        return "📁";
      case "dueDate":
        if (groupKey.includes("Vencidas")) return "❌";
        if (groupKey.includes("hoy")) return "🎯";
        if (groupKey.includes("semana")) return "📅";
        return "📆";
      default:
        return "📝";
    }
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
      loadTasks();
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      if (error instanceof Error) {
        onToastMessage("⚠ " + error.message);
      } else {
        onToastMessage("⚠ Error al eliminar tarea");
      }
    } finally {
      setShowConfirmModal(false);
      setSelectedTaskId(null);
    }
  };

  const handleTaskSuccess = () => {
    loadTasks();
    setCreatingTask(false);
    setEditingTaskId(null);
    onToastMessage("Tarea guardada correctamente");
  };

  // Si onlyContent es true, renderizar solo el contenido
  if (onlyContent) {
    // Filtrar tareas según búsqueda y filtros
    let filteredTasks = tasks.filter(task =>
      task.title.toLowerCase().includes(searchAllTasks.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchAllTasks.toLowerCase())
    );
    
    filteredTasks = filterTasks(filteredTasks, filterBy);
    const groupedTasks = groupTasks(filteredTasks, groupBy);
    
    return (
      <>
        <h3 className="text-4xl font-bold text-indigo-700 text-center mb-6">
          📝 Todas las Tareas
        </h3>

        {/* Controles de filtrado y agrupación */}
        <div className="max-w-4xl mx-auto mb-6 space-y-4">
          {/* Barra de búsqueda */}
          <div className="flex justify-center">
            <input
              type="text"
              placeholder="Buscar en todas las tareas..."
              value={searchAllTasks}
              onChange={(e) => setSearchAllTasks(e.target.value)}
              className="w-full max-w-md p-3 border rounded-lg shadow-sm border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Controles de agrupación y filtros */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Agrupar por */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Agrupar por:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="status">Estado</option>
                <option value="priority">Prioridad</option>
                <option value="project">Proyecto</option>
                <option value="dueDate">Fecha límite</option>
              </select>
            </div>

            {/* Filtros rápidos */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filtrar:</label>
              <div className="flex gap-1">
                {[
                  { key: "all", label: "Todas", color: "gray" },
                  { key: "high", label: "Alta prioridad", color: "red" },
                  { key: "today", label: "Vencen hoy", color: "yellow" },
                  { key: "my-tasks", label: "Asignadas", color: "blue" }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterBy(filter.key as any)}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      filterBy === filter.key
                        ? `bg-${filter.color}-500 text-white`
                        : `bg-${filter.color}-100 text-${filter.color}-700 hover:bg-${filter.color}-200`
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tareas agrupadas */}
        <div className="max-w-5xl mx-auto">
          {Object.keys(groupedTasks).length === 0 ? (
            <p className="text-gray-500 text-center italic">
              No se encontraron tareas que coincidan con los filtros aplicados.
            </p>
          ) : (
            Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
              <div key={groupKey} className="mb-8">
                {/* Header del grupo */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{getGroupIcon(groupKey, groupBy)}</span>
                  <h4 className="text-xl font-semibold text-gray-800">
                    {groupKey}
                  </h4>
                  <span className="bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded-full">
                    {groupTasks.length}
                  </span>
                </div>

                {/* Cards del grupo */}
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {groupTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white hover:bg-indigo-50 transition rounded-xl p-4 shadow border border-gray-200 relative cursor-pointer"
                      onClick={() => handleTaskClick(task)}
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

                      {/* Contenido de la tarea */}
                      <h5 className="font-semibold text-gray-800 mb-2 pr-6">
                        {task.title}
                      </h5>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Información adicional */}
                      <div className="space-y-2">
                        {task.projectId && (
                          <div className="text-xs text-gray-500">
                            📁 {getProjectName(task.projectId)}
                          </div>
                        )}
                        
                        {task.assignedTo && (
                          <div className="text-xs text-gray-500">
                            👤 {task.assignedTo}
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className="text-xs text-gray-500">
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Badges de estado y prioridad */}
                      <div className="flex gap-2 mt-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botón flotante para crear nueva tarea */}
        <button
          onClick={() => setCreatingTask(true)}
          className="fixed bottom-8 right-8 bg-indigo-500 hover:bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
          title="Añadir Tarea"
        >
          <PlusIcon className="w-6 h-6" />
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
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-indigo-400 hover:bg-indigo-500 shadow-lg text-white text-sm transition-all duration-200"
        >
          <ClipboardDocumentListIcon className="w-7 h-7 mb-1" />
          <span className="font-medium">Todas</span>
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
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-indigo-400 hover:bg-indigo-500 shadow-lg text-white text-sm transition-all duration-200 relative z-10 ring-4 ring-offset-2 ring-indigo-200 shadow-indigo-200/70 shadow-xl"
          style={{ transform: "scale(1.2)" }}
        >
          <ClipboardDocumentListIcon className="w-9 h-9 mb-1" />
          <span className="font-medium">Todas</span>
        </button>
      </div>

      {/* Vista de contenido */}
      <div className="mt-10 relative">
        <div className="min-h-96">
          <div className="relative">
            <h3 className="text-4xl font-bold text-indigo-700 text-center mb-6">
              📝 Todas las Tareas
            </h3>

            {/* Controles de filtrado y agrupación */}
            <div className="max-w-4xl mx-auto mb-6 space-y-4">
              {/* Barra de búsqueda */}
              <div className="flex justify-center">
                <input
                  type="text"
                  placeholder="Buscar en todas las tareas..."
                  value={searchAllTasks}
                  onChange={(e) => setSearchAllTasks(e.target.value)}
                  className="w-full max-w-md p-3 border rounded-lg shadow-sm border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Controles de agrupación y filtros */}
              <div className="flex flex-wrap justify-center gap-4">
                {/* Agrupar por */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Agrupar por:</label>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="status">Estado</option>
                    <option value="priority">Prioridad</option>
                    <option value="project">Proyecto</option>
                    <option value="dueDate">Fecha límite</option>
                  </select>
                </div>

                {/* Filtros rápidos */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Filtrar:</label>
                  <div className="flex gap-1">
                    {[
                      { key: "all", label: "Todas", color: "gray" },
                      { key: "high", label: "Alta prioridad", color: "red" },
                      { key: "today", label: "Vencen hoy", color: "yellow" },
                      { key: "my-tasks", label: "Asignadas", color: "blue" }
                    ].map(filter => (
                      <button
                        key={filter.key}
                        onClick={() => setFilterBy(filter.key as any)}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          filterBy === filter.key
                            ? `bg-${filter.color}-500 text-white`
                            : `bg-${filter.color}-100 text-${filter.color}-700 hover:bg-${filter.color}-200`
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tareas agrupadas */}
            <div className="max-w-5xl mx-auto">
              {(() => {
                // Filtrar tareas según búsqueda y filtros
                let filteredTasks = tasks.filter(task =>
                  task.title.toLowerCase().includes(searchAllTasks.toLowerCase()) ||
                  task.description?.toLowerCase().includes(searchAllTasks.toLowerCase())
                );
                
                filteredTasks = filterTasks(filteredTasks, filterBy);
                const groupedTasks = groupTasks(filteredTasks, groupBy);
                
                if (Object.keys(groupedTasks).length === 0) {
                  return (
                    <p className="text-gray-500 text-center italic">
                      No se encontraron tareas que coincidan con los filtros aplicados.
                    </p>
                  );
                }

                return Object.entries(groupedTasks).map(([groupKey, groupTasks]) => (
                  <div key={groupKey} className="mb-8">
                    {/* Header del grupo */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{getGroupIcon(groupKey, groupBy)}</span>
                      <h4 className="text-xl font-semibold text-gray-800">
                        {groupKey}
                      </h4>
                      <span className="bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded-full">
                        {groupTasks.length}
                      </span>
                    </div>

                    {/* Cards del grupo */}
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {groupTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white hover:bg-indigo-50 transition rounded-xl p-4 shadow border border-gray-200 relative cursor-pointer"
                          onClick={() => handleTaskClick(task)}
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

                          {/* Contenido de la tarea */}
                          <h5 className="font-semibold text-gray-800 mb-2 pr-6">
                            {task.title}
                          </h5>
                          
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Información adicional */}
                          <div className="space-y-2">
                            {task.projectId && (
                              <div className="text-xs text-gray-500">
                                📁 {getProjectName(task.projectId)}
                              </div>
                            )}
                            
                            {task.assignedTo && (
                              <div className="text-xs text-gray-500">
                                👤 {task.assignedTo}
                              </div>
                            )}
                            
                            {task.dueDate && (
                              <div className="text-xs text-gray-500">
                                📅 {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Badges de estado y prioridad */}
                          <div className="flex gap-2 mt-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Botón flotante para crear nueva tarea */}
            <button
              onClick={() => setCreatingTask(true)}
              className="fixed bottom-8 right-8 bg-indigo-500 hover:bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
              title="Añadir Tarea"
            >
              <PlusIcon className="w-6 h-6" />
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

export default BotonTodasTareas;