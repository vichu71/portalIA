import React from 'react';
import { X, Calendar, Target, Clock, User, Tag, Folder, CalendarDays, Play } from 'lucide-react';
import { Task } from '../services/taskService';

interface TaskDetailsModalProps {
  task: Task;
  projectName: string | null;
  onClose: () => void;
  onEdit: () => void;
  onOpenCalendar?: (task: Task) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  projectName,
  onClose,
  onEdit,
  onOpenCalendar,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-300';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'baja': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completada': return 'bg-green-100 text-green-800 border-green-300';
      case 'en_progreso': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pendiente': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Función para obtener la fecha de inicio efectiva
  const getEffectiveStartDate = (): string | undefined => {
    // Priorizar startDate sobre createdAt
    return task.startDate || task.createdAt;
  };

  const calculateDuration = () => {
    const effectiveStartDate = getEffectiveStartDate();
    if (!effectiveStartDate || !task.dueDate) return null;
    
    const startDate = new Date(effectiveStartDate);
    const endDate = new Date(task.dueDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const duration = calculateDuration();
  const effectiveStartDate = getEffectiveStartDate();
  const hasTimeRange = effectiveStartDate && task.dueDate;
  const hasAnyDate = effectiveStartDate || task.dueDate;
  const hasCustomStartDate = !!task.startDate; // Indica si tiene fecha de inicio personalizada

  const handleOpenCalendar = () => {
    if (onOpenCalendar) {
      onOpenCalendar(task);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50 rounded-t-xl">
          <h2 className="text-2xl font-bold text-purple-700">
            Detalles de Tarea
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Título */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {task.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Estados y prioridad */}
          <div className="flex gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
              <Tag className="w-4 h-4 inline mr-1" />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} prioridad
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(task.status)}`}>
              <Target className="w-4 h-4 inline mr-1" />
              {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.replace('_', ' ').slice(1)}
            </span>
          </div>

          {/* Información de fechas */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Cronología
              </h4>
              
              {/* Botón para abrir calendario */}
              <button
                onClick={handleOpenCalendar}
                disabled={!onOpenCalendar || !hasAnyDate}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  (onOpenCalendar && hasAnyDate)
                    ? 'text-white bg-green-500 hover:bg-green-600 border-2 border-green-600 shadow-lg' 
                    : 'text-gray-400 bg-gray-200 border-2 border-gray-300 cursor-not-allowed'
                }`}
                title={hasTimeRange ? "Ver rango completo en calendario" : "Ver fecha en calendario"}
              >
                <CalendarDays className="w-4 h-4" />
                {hasTimeRange ? "VER RANGO" : "VER FECHA"}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha de inicio */}
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Play className="w-3 h-3 text-green-500 mr-2" />
                  <span className="font-medium">
                    {hasCustomStartDate ? 'Fecha de inicio:' : 'Fecha de inicio (creación):'}
                  </span>
                </div>
                <p className="text-gray-600 ml-5">
                  {formatDate(effectiveStartDate)}
                </p>
                {hasCustomStartDate && (
                  <p className="text-xs text-green-600 ml-5">
                    📅 Fecha personalizada
                  </p>
                )}
              </div>
              
              {/* Fecha límite */}
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Target className="w-3 h-3 text-red-500 mr-2" />
                  <span className="font-medium">Fecha límite:</span>
                </div>
                <p className="text-gray-600 ml-5">
                  {formatDate(task.dueDate)}
                </p>
              </div>
              {/* Fecha de finalización */}
<div className="space-y-2">
  <div className="flex items-center text-sm">
    <Target className="w-3 h-3 text-green-600 mr-2" />
    <span className="font-medium">Fecha de finalización:</span>
  </div>
  <p className="text-gray-600 ml-5">
    {formatDate(task.completedDate)}
  </p>
</div>
            </div>

            {/* Duración calculada */}
            {duration && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="font-medium">Duración planificada:</span>
                  <span className="ml-2 text-blue-600 font-semibold">
                    {duration} {duration === 1 ? 'día' : 'días'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectName && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <Folder className="w-4 h-4 mr-2" />
                  Proyecto:
                </div>
                <p className="text-gray-900 font-semibold ml-6">
                  {projectName}
                </p>
              </div>
            )}

            {task.assignedTo && (
              <div className="space-y-2">
                <div className="flex items-center text-sm font-medium text-gray-700">
                  <User className="w-4 h-4 mr-2" />
                  Asignado a:
                </div>
                <p className="text-gray-900 font-semibold ml-6">
                  {task.assignedTo}
                </p>
              </div>
            )}
          </div>

          {/* Metadatos de auditoría */}
          {(task.createdAt || task.updatedAt) && (
            <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-100">
              <p className="font-medium text-gray-600 mb-2">Información de auditoría:</p>
              {task.createdAt && (
                <p>📝 Registrada: {new Date(task.createdAt).toLocaleString('es-ES')}</p>
              )}
              {task.updatedAt && task.updatedAt !== task.createdAt && (
                <p>✏️ Última modificación: {new Date(task.updatedAt).toLocaleString('es-ES')}</p>
              )}
              {hasCustomStartDate && task.createdAt && task.startDate !== task.createdAt?.split('T')[0] && (
                <p className="text-blue-600">
                  🗓️ Fecha de inicio personalizada (diferente a la fecha de creación)
                </p>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={onEdit}
              className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Editar Tarea
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;