
import { useState, useEffect } from 'react';
import { getTasks, Task, deleteTask, updateTask } from '../services/taskService';
import { getProjects, Project } from '../services/projectService';

export interface TaskFilters {
  search: string;
  project: string;
  priority: string;
}

export const useTaskManagement = (isActive: boolean) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    project: '',
    priority: ''
  });
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (isActive) {
      loadTasks(filters.search);
      loadProjects();
    }
  }, [isActive, filters.search]);

  const loadTasks = async (title: string = "") => {
    try {
      const tasksData = await getTasks(title);
      setTasks(tasksData);
    } catch (err) {
      console.error("Error cargando tareas:", err);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (err) {
      console.error("Error cargando proyectos:", err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await deleteTask(taskId);
      await loadTasks(filters.search);
      return { success: true, message: "Tarea eliminada correctamente" };
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
      const message = error instanceof Error ? error.message : "Error al eliminar tarea";
      return { success: false, message: `⚠️ ${message}` };
    }
  };

  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      const updatedTask = await updateTask(taskId, updates);
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );
      return { success: true, task: updatedTask };
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      await loadTasks(filters.search);
      return { success: false, message: 'Error al actualizar la tarea' };
    }
  };

  const applyFilters = (tasksToFilter: Task[]) => {
    return tasksToFilter.filter(task => {
      const matchesText = task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                          task.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesProject = filters.project === "" || 
                            (filters.project === "sin-proyecto" ? !task.projectId : task.projectId?.toString() === filters.project);
      
      const matchesPriority = filters.priority === "" || task.priority === filters.priority;
      
      return matchesText && matchesProject && matchesPriority;
    });
  };

  const filteredTasks = applyFilters(tasks);

  return {
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
  };
};
