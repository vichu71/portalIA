import React from 'react';
import { Task } from '../../../services/taskService';
import { Project } from '../../../services/projectService';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../ui/dropdown-menu';
import { 
  getProjectName, 
  getProjectColor, 
  getPriorityColor, 
  getPrioritySelectColor, 
  getPriorityEmoji,
  getStatusColor
} from '../../../utils/taskUtils';

interface TaskListProps {
  tasks: Task[];
  allTasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onEditTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  allTasks,
  projects,
  onTaskClick,
  onEditTask,
  onDeleteTask
}) => {
  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
      {tasks.length === 0 ? (
        <p className="text-gray-500 text-center italic">
          {allTasks.length === 0 ? "No hay tareas registradas aún." : "No se encontraron tareas con los filtros aplicados."}
        </p>
      ) : (
        tasks.map((task) => {
          const projectName = getProjectName(task.projectId, projects);
          
          return (
            <div
              key={task.id}
              className="bg-white hover:bg-purple-50 transition rounded-xl px-5 py-4 shadow border border-gray-200 relative cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <h3 className="text-lg font-semibold text-gray-800">
                {task.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {task.description}
              </p>
              {projectName && (
                <p className="text-base font-bold text-gray-700 mt-2 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getProjectColor(projectName)} border border-white shadow-sm`}></div>
                  Proyecto: {projectName}
                </p>
              )}
              {task.assignedTo && (
                <p className="text-sm text-gray-500 mt-1">
                  Asignado a: {task.assignedTo}
                </p>
              )}
              {task.dueDate && (
                <p className="text-sm text-gray-500 mt-1">
                  Fecha límite: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
              <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${getPrioritySelectColor(task.priority)} border border-white shadow-sm flex items-center justify-center`}>
                      <span style={{fontSize: '8px'}}>{getPriorityEmoji(task.priority)}</span>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {task.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default TaskList;