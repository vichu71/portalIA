// services/dailyNoteService.ts

export interface DailyNote {
  id: number;
  date: string; // formato YYYY-MM-DD
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDailyNoteData {
  date: string; // formato YYYY-MM-DD
  content: string;
}

export interface UpdateDailyNoteData extends Partial<CreateDailyNoteData> {}

export interface CreateOrUpdateDailyNoteData {
  date: string; // formato YYYY-MM-DD
  content: string;
}

export interface DailyNoteStats {
  total: number;
  este_mes: number;
  este_año: number;
  esta_semana: number;
  promedio_caracteres: number;
}

// URL base de la API - usando la misma que taskService
const BASE_URL = 'http://localhost:8081';

/**
 * Obtiene todas las notas diarias con filtros opcionales
 */
export const getDailyNotes = async (
  startDate?: string, 
  endDate?: string, 
  content?: string
): Promise<DailyNote[]> => {
  try {
    const url = new URL(`${BASE_URL}/api/daily-notes`);
    if (startDate) {
      url.searchParams.append("startDate", startDate);
    }
    if (endDate) {
      url.searchParams.append("endDate", endDate);
    }
    if (content) {
      url.searchParams.append("content", content);
    }

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("No se pudo cargar la lista de notas diarias");
    const data = await res.json();

    // Si el backend devuelve una Page, extrae el contenido
    return data.content || [];
  } catch (error) {
    console.error('Error fetching daily notes:', error);
    throw new Error('Error al cargar las notas diarias');
  }
};

/**
 * Obtiene una nota diaria por su ID
 */
export const getDailyNoteById = async (id: number): Promise<DailyNote> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/${id}`);
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Nota diaria no encontrada');
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching daily note:', error);
    throw error;
  }
};

/**
 * Obtiene una nota diaria por su fecha
 */
export const getDailyNoteByDate = async (date: string): Promise<DailyNote | null> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/date/${date}`);
    if (res.status === 404) {
      return null; // No existe nota para esa fecha
    }
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching daily note by date:', error);
    throw error;
  }
};

/**
 * Crea una nueva nota diaria
 */
export const createDailyNote = async (noteData: CreateDailyNoteData): Promise<DailyNote> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating daily note:', error);
    throw error;
  }
};

/**
 * Crea o actualiza una nota diaria (ideal para el calendario)
 */
export const createOrUpdateDailyNote = async (noteData: CreateOrUpdateDailyNoteData): Promise<DailyNote | null> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/create-or-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
    }

    const result = await res.json();
    
    // Si tiene un mensaje, significa que fue eliminada
    if (result.message) {
      return null; // Nota eliminada
    }
    
    return result;
  } catch (error) {
    console.error('Error creating or updating daily note:', error);
    throw error;
  }
};

/**
 * Actualiza una nota diaria existente por ID
 */
export const updateDailyNote = async (id: number, noteData: UpdateDailyNoteData): Promise<DailyNote> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Nota diaria no encontrada');
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating daily note:', error);
    throw error;
  }
};

/**
 * Actualiza una nota diaria existente por fecha
 */
export const updateDailyNoteByDate = async (date: string, content: string): Promise<DailyNote> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/date/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Nota diaria no encontrada');
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error updating daily note by date:', error);
    throw error;
  }
};

/**
 * Elimina una nota diaria por ID
 */
export const deleteDailyNote = async (id: number): Promise<void> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Nota diaria no encontrada');
      }
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting daily note:', error);
    throw error;
  }
};

/**
 * Elimina una nota diaria por fecha
 */
export const deleteDailyNoteByDate = async (date: string): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/date/${date}`, {
      method: 'DELETE',
    });

    if (res.status === 404) {
      return false; // No existía la nota
    }
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return true; // Eliminada correctamente
  } catch (error) {
    console.error('Error deleting daily note by date:', error);
    throw error;
  }
};

/**
 * Obtiene notas diarias por mes específico
 */
export const getDailyNotesByMonth = async (year: number, month: number): Promise<DailyNote[]> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/month/${year}/${month}`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching daily notes by month:', error);
    throw new Error('Error al cargar las notas del mes');
  }
};

/**
 * Obtiene notas diarias por año específico
 */
export const getDailyNotesByYear = async (year: number): Promise<DailyNote[]> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/year/${year}`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching daily notes by year:', error);
    throw new Error('Error al cargar las notas del año');
  }
};

/**
 * Obtiene notas diarias del mes actual
 */
export const getCurrentMonthDailyNotes = async (): Promise<DailyNote[]> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/current-month`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching current month daily notes:', error);
    throw new Error('Error al cargar las notas del mes actual');
  }
};

/**
 * Obtiene notas diarias en un rango de fechas
 */
export const getDailyNotesByDateRange = async (startDate: string, endDate: string): Promise<DailyNote[]> => {
  try {
    const url = new URL(`${BASE_URL}/api/daily-notes/date-range`);
    url.searchParams.append("startDate", startDate);
    url.searchParams.append("endDate", endDate);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching daily notes by date range:', error);
    throw new Error('Error al cargar las notas del rango de fechas');
  }
};

/**
 * Busca notas diarias por contenido
 */
export const searchDailyNotesByContent = async (content: string): Promise<DailyNote[]> => {
  try {
    const url = new URL(`${BASE_URL}/api/daily-notes/search`);
    url.searchParams.append("content", content);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error searching daily notes:', error);
    throw new Error('Error al buscar las notas diarias');
  }
};

/**
 * Verifica si existe una nota para una fecha específica
 */
export const checkIfDailyNoteExists = async (date: string): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/exists/${date}`);
    if (!res.ok) {
      return false;
    }
    const data = await res.json();
    return data.exists;
  } catch (error) {
    console.error('Error checking daily note existence:', error);
    return false;
  }
};

/**
 * Obtiene un mapa de fecha -> contenido para un rango de fechas
 * Ideal para cargar eficientemente el calendario
 */
export const getDailyNotesMap = async (startDate: string, endDate: string): Promise<Map<string, string>> => {
  try {
    const url = new URL(`${BASE_URL}/api/daily-notes/map`);
    url.searchParams.append("startDate", startDate);
    url.searchParams.append("endDate", endDate);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    
    // Convertir el objeto a Map
    const notesMap = new Map<string, string>();
    Object.entries(data).forEach(([date, content]) => {
      notesMap.set(date, content as string);
    });
    
    return notesMap;
  } catch (error) {
    console.error('Error fetching daily notes map:', error);
    throw new Error('Error al cargar el mapa de notas');
  }
};

/**
 * Obtiene estadísticas de notas diarias
 */
export const getDailyNoteStats = async (): Promise<DailyNoteStats> => {
  try {
    const res = await fetch(`${BASE_URL}/api/daily-notes/stats`);
    if (!res.ok) {
      throw new Error(`Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching daily note stats:', error);
    throw new Error('Error al cargar las estadísticas de notas diarias');
  }
};