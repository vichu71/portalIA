import React, { useState } from "react";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { Task } from "../services/taskService";
import { useTaskManagement } from "../hooks/useTaskManagement";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import TaskFilters from "../components/tasks/TaskFilters";
import ViewSelector, { ViewType } from "../components/tasks/ViewSelector";
import KanbanView from "../components/tasks/views/KanbanView";
import TableView from "../components/tasks/views/TableView";
import TaskList from "../components/tasks/views/TaskList";
import TaskEditorModal from "../components/TaskEditorModal";
import TaskDetailsModal from "../components/TaskDetailModal";
import ConfirmModal from "../components/ConfirmModal";

interface BotonTareasProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean;
  onOpenCalendar?: (task: Task) => void;
}

const BotonTareas: React.FC<BotonTareasProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false,
  onOpenCalendar,
}) => {
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  
  const {
    tasks,
    projects,
    filters,
    setFilters,
    filteredTasks,
    selectedTaskId,
    setSelectedTaskId,
    editingTaskId,
    setEditingTaskId,
    selectedTaskForDetails,
    setSelectedTaskForDetails,
    creatingTask,
    setCreatingTask,
    showConfirmModal,
    setShowConfirmModal,
    loadTasks,
    handleDeleteTask,
    handleUpdateTask
  } = useTaskManagement(isActive);

  const dragAndDropHandlers = useDragAndDrop(handleUpdateTask, onToastMessage);

  const handleTaskClick = (task: Task) => {
    setSelectedTaskForDetails(task);
  };

  const confirmDeleteTask = async () => {
    if (!selectedTaskId) return;
    const result = await handleDeleteTask(selectedTaskId);
    onToastMessage(result.message);
    setShowConfirmModal(false);
    setSelectedTaskId(null);
  };

  const handleTaskSuccess = () => {
    loadTasks(filters.search);
    setCreatingTask(false);
    setEditingTaskId(null);
    onToastMessage("Tarea guardada correctamente");
  };

  const openDeleteConfirmModal = (taskId: number) => {
    setSelectedTaskId(taskId);
    setShowConfirmModal(true);
  };

  // Renderizado del contenido completo
  if (onlyContent) {
    return (
      <>
        <h3 className="text-4xl font-bold text-purple-700 text-center mb-4">
          📋 Gestión de Tareas
        </h3>
        
        <div className="max-w-7xl mx-auto mb-6">
          <TaskFilters 
            filters={filters} 
            setFilters={setFilters} 
            projects={projects} 
          />
          
          <ViewSelector 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
          />
        </div>

        {currentView === 'kanban' ? (
          <KanbanView
            tasks={filteredTasks}
            projects={projects}
            onTaskClick={handleTaskClick}
            onEditTask={setEditingTaskId}
            onDeleteTask={openDeleteConfirmModal}
            dragAndDropHandlers={dragAndDropHandlers}
          />
        ) : (
          <TableView
            tasks={filteredTasks}
            allTasks={tasks}
            projects={projects}
            onTaskClick={handleTaskClick}
            onEditTask={setEditingTaskId}
            onDeleteTask={openDeleteConfirmModal}
          />
        )}

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
            projectName={projects.find(p => p.id === selectedTaskForDetails.projectId)?.name || null}
            onClose={() => setSelectedTaskForDetails(null)}
            onEdit={() => {
              setEditingTaskId(selectedTaskForDetails.id);
              setSelectedTaskForDetails(null);
            }}
            onOpenCalendar={onOpenCalendar}
          />
        )}
      </>
    );
  }

  // Vista del botón cuando no está activo
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

  // Vista activa con lista de tareas
  return (
    <>
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

      <div className="mt-10 relative">
        <div className="min-h-96">
          <h3 className="text-4xl font-bold text-purple-700 text-center mb-4">
            ✅ Lista de Tareas Pendientes
          </h3>
          
          <div className="max-w-xl mx-auto mb-6">
            <TaskFilters 
              filters={filters} 
              setFilters={setFilters} 
              projects={projects} 
            />
          </div>

          <TaskList
            tasks={filteredTasks}
            allTasks={tasks}
            projects={projects}
            onTaskClick={handleTaskClick}
            onEditTask={setEditingTaskId}
            onDeleteTask={openDeleteConfirmModal}
          />

          <button
            onClick={() => setCreatingTask(true)}
            className="fixed bottom-8 right-8 bg-purple-400 hover:bg-purple-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
            title="Añadir Tarea"
          >
            <ClipboardDocumentListIcon className="w-6 h-6" />
          </button>
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
          projectName={projects.find(p => p.id === selectedTaskForDetails.projectId)?.name || null}
          onClose={() => setSelectedTaskForDetails(null)}
          onEdit={() => {
            setEditingTaskId(selectedTaskForDetails.id);
            setSelectedTaskForDetails(null);
          }}
          onOpenCalendar={onOpenCalendar}
        />
      )}
    </>
  );
};

export default BotonTareas;