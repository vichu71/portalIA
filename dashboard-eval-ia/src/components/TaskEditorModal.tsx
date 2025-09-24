import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Task, getTaskById, createTask, updateTask, CreateTaskData, UpdateTaskData } from '../services/taskService';
import { getProjects, Project } from '../services/projectService';

interface TaskEditorModalProps {
  taskId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  taskId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    priority: 'alta' | 'media' | 'baja';
    status: 'pendiente' | 'en_progreso' | 'completada';
    startDate: string;  // NUEVO: Fecha de inicio
    dueDate: string;
    completedDate: string;
    assignedTo: string;
    projectId: string;
  }>({
    title: '',
    description: '',
    priority: 'media',
    status: 'pendiente',
    startDate: new Date().toISOString().split('T')[0], // Por defecto: hoy
    dueDate: '',
    completedDate: '',
    assignedTo: '',
    projectId: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Datos de prueba para usuarios asignables
  const mockUsers = [
    'Víctor Huecas',
  ];

  useEffect(() => {
    // Cargar proyectos disponibles
    loadProjects();
    
    if (taskId) {
      // Cargar datos de la tarea existente
      loadTaskData(taskId);
    }
  }, [taskId]);

  const loadProjects = async () => {
    try {
      const projectsData = await getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Error al cargar los proyectos');
    }
  };

  const loadTaskData = async (id: number) => {
    setLoading(true);
    try {
      const task = await getTaskById(id);
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        startDate: task.startDate || task.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        dueDate: task.dueDate || '',
        completedDate: task.completedDate || '',
        assignedTo: task.assignedTo || '',
        projectId: task.projectId?.toString() || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de la tarea');
      console.error('Error loading task data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones básicas
      if (!formData.title.trim()) {
        throw new Error('El título es obligatorio');
      }
      if (!formData.description.trim()) {
        throw new Error('La descripción es obligatoria');
      }
      if (!formData.startDate) {
        throw new Error('La fecha de inicio es obligatoria');
      }
      
      // Validar que la fecha de inicio no sea posterior a la fecha límite
      if (formData.dueDate && formData.startDate > formData.dueDate) {
        throw new Error('La fecha de inicio no puede ser posterior a la fecha límite');
      }

      // Preparar datos para envío
      const taskData: CreateTaskData | UpdateTaskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: formData.status,
        projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
        startDate: formData.startDate,  // NUEVO: incluir startDate
        dueDate: formData.dueDate || undefined,
        completedDate: formData.status === 'completada'
    ? (formData.completedDate || new Date().toISOString().split('T')[0])
    : undefined, // si no está completada, no mandamos fecha de fin
        assignedTo: formData.assignedTo || undefined,
      };

      if (taskId) {
        // Actualizar tarea existente
        await updateTask(taskId, taskData);
      } else {
        // Crear nueva tarea
        await createTask(taskData as CreateTaskData);
      }
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

const handleChange = (field: string, value: string) => {
  setFormData(prev => {
    // Reglas de estado → completedDate
    if (field === 'status') {
      const today = new Date().toISOString().split('T')[0];
      if (value === 'completada' && !prev.completedDate) {
        return { ...prev, status: value as any, completedDate: today };
      }
      if (value !== 'completada') {
        return { ...prev, status: value as any, completedDate: '' };
      }
    }
    return { ...prev, [field]: value };
  });
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50 rounded-t-xl">
          <h2 className="text-2xl font-bold text-purple-700">
            {taskId ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ingresa el título de la tarea"
              disabled={loading}
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Describe la tarea en detalle"
              disabled={loading}
              required
            />
          </div>

          {/* Fila de campos: Prioridad y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
              </select>
            </div>
          </div>

          {/* Fila de campos: Proyecto y Asignado a */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Proyecto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proyecto
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => handleChange('projectId', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Sin asignar</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asignado a */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asignado a
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => handleChange('assignedTo', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Sin asignar</option>
                {mockUsers.map(user => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* NUEVO: Fila de fechas - Fecha de inicio y Fecha límite */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no se especifica, se usará la fecha actual
              </p>
            </div>

            {/* Fecha límite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha límite
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
                min={formData.startDate || new Date().toISOString().split('T')[0]} // No puede ser anterior a la fecha de inicio
              />
              <p className="text-xs text-gray-500 mt-1">
                Opcional - debe ser posterior a la fecha de inicio
              </p>
            </div>
            {/* Fecha de finalización */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Fecha de finalización
    </label>
    <input
      type="date"
      value={formData.completedDate}
      onChange={(e) => handleChange('completedDate', e.target.value)}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      disabled={loading || formData.status !== 'completada'}
      min={formData.startDate || undefined}
    />
    <p className="text-xs text-gray-500 mt-1">
      Solo editable si la tarea está “completada”.
    </p>
  </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (taskId ? 'Actualizar' : 'Crear Tarea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditorModal;