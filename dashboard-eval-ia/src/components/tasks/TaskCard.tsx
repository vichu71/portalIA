import React from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { Task } from '../../services/taskService';
import { Project } from '../../services/projectService';
import { 
  getProjectName, 
  getProjectColor, 
  getPriorityColor, 
  getPrioritySelectColor, 
  getPriorityEmoji 
} from '../../utils/taskUtils';

interface TaskCardProps {
  task: Task;
  projects: Project[];
  isDragged: boolean;
  onClick: () => void;
  onEdit: (taskId: number) => void;
  onDelete: (taskId: number) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

const getPriorityShadowStyle = (priority: string) => {
  switch (priority) {
    case "alta": 
      return "shadow-md shadow-red-400 hover:shadow-lg hover:shadow-red-300";
    case "media": 
      return "shadow-md shadow-yellow-400 hover:shadow-lg hover:shadow-yellow-300";
    case "baja": 
      return "shadow-md shadow-green-400 hover:shadow-lg hover:shadow-green-300";
    default: 
      return "shadow-md shadow-gray-300 hover:shadow-lg hover:shadow-gray-300";
  }
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projects,
  isDragged,
  onClick,
  onEdit,
  onDelete,
  onDragStart
}) => {
  const projectName = getProjectName(task.projectId, projects);
  //const priorityStyle = getPriorityShadowStyle(task.priority);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
     className={`bg-white hover:bg-purple-50 transition-all duration-200 rounded-lg p-4 
  ${getPriorityShadowStyle(task.priority)} border border-gray-200 
  relative cursor-grab active:cursor-grabbing
  ${isDragged ? 'opacity-50 rotate-1 scale-95' : 'hover:scale-[1.05] hover:-translate-y-1'}
`}
      onClick={onClick}
    >
      {/* Indicador de prioridad en la esquina superior derecha */}
      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${getPrioritySelectColor(task.priority)} 
        border-2 border-white shadow-md flex items-center justify-center z-10`}>
        <span className="text-xs">{getPriorityEmoji(task.priority)}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            className="absolute top-2 right-8 text-gray-400 hover:text-gray-700 z-20 p-1 rounded-full hover:bg-white/80"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task.id);
            }}
            className="flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="flex items-center gap-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Icono de arrastre */}
      <div className="absolute top-2 left-2 text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <h5 className="font-semibold text-gray-800 mb-2 pr-8 pl-6">
        {task.title}
      </h5>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 pl-6 line-clamp-2">
          {task.description}
        </p>
      )}

      {projectName && (
        <div className="text-sm font-medium text-gray-700 mb-2 pl-6 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getProjectColor(projectName)} border border-white shadow-sm`}></div>
          <span className="truncate">📁 {projectName}</span>
        </div>
      )}
      
      {task.assignedTo && (
        <p className="text-sm text-gray-500 mb-2 pl-6 truncate">
          👤 {task.assignedTo}
        </p>
      )}
      
      {task.dueDate && (
        <p className="text-sm text-gray-500 mb-2 pl-6">
          📅 {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
      {task.completedDate && (
  <p className="text-sm text-gray-500 mb-2 pl-6">
    ✅ Finalizada: {new Date(task.completedDate).toLocaleDateString('es-ES')}
  </p>
)}


      {/* Footer con prioridad */}
      <div className="flex justify-between items-center mt-3 pl-6">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </div>
        
        {/* Badge del estado si no es pendiente */}
        {task.status !== 'pendiente' && (
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {task.status === 'en_progreso' ? 'En curso' : 'Completada'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;