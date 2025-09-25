import { useState, useEffect, useMemo } from "react";
import { Task, Project, ViewMode, DateRange } from "../components/timeline/types/timeline";
import { getTasks } from "../services/taskService";
import { getProjects } from "../services/projectService";
import {
  filterValidTasks,
  calculateDateRange,
  generateDailyGrid,
} from "../utils/timelineUtils";

/**
 * Hook para manejar los datos del timeline (tareas y proyectos)
 */
export const useTimelineData = (isActive: boolean, onToastMessage: (message: string) => void) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await getTasks();
      console.log("📋 Tareas cargadas en Timeline:", {
        total: tasksData.length,
        sample: tasksData.slice(0, 2).map((t) => ({
          title: t.title,
          startDate: t.startDate,
          dueDate: t.dueDate,
        })),
      });
      setTasks(tasksData);
    } catch (error) {
      console.error("Error cargando tareas:", error);
      onToastMessage("Error al cargar las tareas");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadTasks();
      loadProjects();
    }
  }, [isActive]);

  return {
    tasks,
    projects,
    loading,
    refreshData: () => {
      loadTasks();
      loadProjects();
    },
  };
};

/**
 * Hook para manejar los filtros del timeline
 */
export const useTimelineFilters = () => {
  const [projectFilter, setProjectFilter] = useState<string>("");

  const resetFilters = () => {
    setProjectFilter("");
  };

  return {
    projectFilter,
    setProjectFilter,
    resetFilters,
  };
};

/**
 * Hook para manejar el modo de vista del timeline
 */
export const useTimelineViewMode = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("weeks");

  useEffect(() => {
    console.log("📊 viewMode cambió a:", viewMode);
  }, [viewMode]);

  return {
    viewMode,
    setViewMode,
  };
};

/**
 * Hook para manejar la tarea seleccionada
 */
export const useSelectedTask = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const selectTask = (task: Task) => {
    setSelectedTask(task);
  };

  const clearSelection = () => {
    setSelectedTask(null);
  };

  return {
    selectedTask,
    selectTask,
    clearSelection,
  };
};

/**
 * Hook principal que combina todos los cálculos del timeline
 */
export const useTimelineCalculations = (
  tasks: Task[],
  projectFilter: string,
  viewMode: ViewMode
) => {
  // Filtrar tareas válidas - actualizado para usar startDate
  const validTasks = useMemo(() => {
    const result = tasks.filter((task) => {
      const hasValidDates = task.startDate && task.dueDate;
      const matchesProject =
        projectFilter === "" ||
        (projectFilter === "sin-proyecto"
          ? !task.projectId
          : task.projectId?.toString() === projectFilter);
      return hasValidDates && matchesProject;
    });

    console.log("🔍 DEBUG validTasks:", {
      totalTasks: tasks.length,
      validTasks: result.length,
      projectFilter,
      tasksWithDates: tasks.filter((t) => t.startDate && t.dueDate).length,
    });

    if (result.length > 0) {
      console.log(
        "✅ Primeras tareas válidas:",
        result.slice(0, 3).map((t) => ({
          title: t.title,
          startDate: t.startDate,
          dueDate: t.dueDate,
        }))
      );
    }

    return result;
  }, [tasks, projectFilter]);

  // Calcular rango de fechas - actualizado para usar startDate
  const dateRange = useMemo(() => {
    if (validTasks.length === 0) return { start: new Date(), end: new Date() };

    const dates = validTasks.flatMap((task) => [
      new Date(task.startDate!),
      new Date(task.dueDate!),
    ]);

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Agregar margen
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    return { start: minDate, end: maxDate };
  }, [validTasks]);

  // Generar cuadrícula de días
  const dailyGrid = useMemo(() => {
    return generateDailyGrid(dateRange);
  }, [dateRange]);

  return {
    validTasks,
    dateRange,
    dailyGrid,
  };
};