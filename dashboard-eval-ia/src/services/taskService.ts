export interface Task {
  id: number;
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  status: 'pendiente' | 'en_progreso' | 'completada';
  startDate?: string;    // NUEVO CAMPO: fecha de inicio configurable
  dueDate?: string;
  completedDate?: string; // YYYY-MM-DD
  assignedTo?: string;
  projectId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  priority: 'alta' | 'media' | 'baja';
  status: 'pendiente' | 'en_progreso' | 'completada';
  startDate?: string;    // NUEVO CAMPO: fecha de inicio opcional
  dueDate?: string;
  completedDate?: string;
  assignedTo?: string;
  projectId?: number;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {}

// Función auxiliar para obtener la fecha de inicio efectiva
export const getEffectiveStartDate = (task: Task): string => {
  // Si tiene startDate, usar esa; sino usar createdAt; sino fecha actual
  return task.startDate || 
         task.createdAt?.split('T')[0] || 
         new Date().toISOString().split('T')[0];
};

// Función auxiliar para calcular duración en días
export const calculateTaskDuration = (task: Task): number | null => {
  const startDate = getEffectiveStartDate(task);
  if (!startDate || !task.dueDate) return null;
  
  const start = new Date(startDate);
  const end = new Date(task.dueDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// URL base de la API - usando la misma que projectService
const BASE_URL = 'http://localhost:8081';

/**
 * Obtiene todas las tareas, con filtro opcional por título
 */
export const getTasks = async (title: string = ""): Promise<Task[]> => {
  try {
    const url = new URL(`${BASE_URL}/api/tasks`);
    if (title) {
      url.searchParams.append("title", title);
    }

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("No se pudo cargar la lista de tareas");
    const data = await res.json();

    // Si el backend devuelve una Page, extrae el contenido
    return data.content || [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Error al cargar las tareas');
  }
};

/**
 * Obtiene una tarea por su ID
 */
export const getTaskById = async (id: number): Promise<Task> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Tarea no encontrada');
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

/**
 * Crea una nueva tarea
 */
export const createTask = async (taskData: CreateTaskData): Promise<Task> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Actualiza una tarea existente
 */
export const updateTask = async (id: number, taskData: UpdateTaskData): Promise<Task> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Tarea no encontrada');
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

/**
 * Elimina una tarea
 */
export const deleteTask = async (id: number): Promise<void> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Tarea no encontrada');
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Obtiene tareas por proyecto
 */
export const getTasksByProject = async (projectId: number): Promise<Task[]> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/project/${projectId}`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    throw new Error('Error al cargar las tareas del proyecto');
  }
};

/**
 * Obtiene estadísticas de tareas
 */
export const getTaskStats = async (): Promise<{
  total: number;
  pendientes: number;
  en_progreso: number;
  completadas: number;
  por_prioridad: Record<string, number>;
}> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/stats`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching task stats:', error);
    throw new Error('Error al cargar las estadísticas de tareas');
  }
};

/**
 * Obtiene tareas por estado
 */
export const getTasksByStatus = async (status: string): Promise<Task[]> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/status/${status}`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching tasks by status:', error);
    throw new Error('Error al cargar las tareas por estado');
  }
};

/**
 * Obtiene tareas por prioridad
 */
export const getTasksByPriority = async (priority: string): Promise<Task[]> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/priority/${priority}`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching tasks by priority:', error);
    throw new Error('Error al cargar las tareas por prioridad');
  }
};

/**
 * Asigna una tarea a un proyecto
 */
export const assignTaskToProject = async (taskId: number, projectId: number): Promise<Task> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${taskId}/assign-project/${projectId}`, {
      method: 'PUT',
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Tarea o proyecto no encontrado');
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error assigning task to project:', error);
    throw error;
  }
};

/**
 * Desasigna una tarea de un proyecto
 */
export const unassignTaskFromProject = async (taskId: number): Promise<Task> => {
  try {
    const res = await fetch(`${BASE_URL}/api/tasks/${taskId}/unassign-project`, {
      method: 'PUT',
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Tarea no encontrada');
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error unassigning task from project:', error);
    throw error;
  }
};