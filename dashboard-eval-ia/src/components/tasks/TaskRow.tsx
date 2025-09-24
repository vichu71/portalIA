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
  getPriorityEmoji,
  getStatusColor,
  getStatusDisplayName
} from '../../utils/taskUtils';

interface TaskRowProps {
  task: Task;
  projects: Project[];
  onClick: () => void;
  onEdit: (taskId: number) => void;
  onDelete: (taskId: number) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  projects,
  onClick,
  onEdit,
  onDelete
}) => {
  const projectName = getProjectName(task.projectId, projects);

  return (
    <tr 
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-semibold text-gray-900">{task.title}</div>
          {task.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        {projectName ? (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getProjectColor(projectName)} border border-white shadow-sm`}></div>
            <span className="text-sm text-gray-700">{projectName}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Sin proyecto</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getPrioritySelectColor(task.priority)} border border-white shadow-sm flex items-center justify-center`}>
            <span style={{fontSize: '8px'}}>{getPriorityEmoji(task.priority)}</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
          {getStatusDisplayName(task.status)}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-700">
          {task.assignedTo || '-'}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-700">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : '-'}
        </span>
      </td>
      <td className="px-6 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="text-gray-400 hover:text-gray-700 p-1 rounded"
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
      </td>
    </tr>
  );
};

export default TaskRow;