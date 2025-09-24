import React from 'react';
import { Task } from '../../../services/taskService';
import { Project } from '../../../services/projectService';
import TaskCard from '../TaskCard';

interface DragAndDropHandlers {
  draggedTask: Task | null;
  dragOverColumn: string | null;
  handleDragStart: (e: React.DragEvent, task: Task) => void;
  handleDragOver: (e: React.DragEvent, columnId: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, newStatus: string) => void;
}

interface KanbanViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onEditTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
  dragAndDropHandlers: DragAndDropHandlers;
}

const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  projects,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  dragAndDropHandlers
}) => {
  const { draggedTask, dragOverColumn, handleDragStart, handleDragOver, handleDragLeave, handleDrop } = dragAndDropHandlers;

  const tasksByStatus = {
    pendiente: tasks.filter(task => task.status === 'pendiente'),
    en_progreso: tasks.filter(task => task.status === 'en_progreso'),
    completada: tasks.filter(task => task.status === 'completada')
  };

  const columns = [
    {
      id: 'pendiente',
      title: '📋 Pendientes',
      tasks: tasksByStatus.pendiente,
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      id: 'en_progreso',
      title: '🔄 En Curso',
      tasks: tasksByStatus.en_progreso,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'completada',
      title: '✅ Realizadas',
      tasks: tasksByStatus.completada,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {columns.map((column) => (
        <div
          key={column.id}
          className={`${column.bgColor} rounded-xl p-4 border-2 ${column.borderColor} min-h-96 transition-all ${
            dragOverColumn === column.id ? 'ring-2 ring-purple-400 ring-offset-2 scale-[1.02]' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              {column.title}
            </h4>
            <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
              {column.tasks.length}
            </span>
          </div>

          <div className="space-y-3">
            {column.tasks.length === 0 ? (
              <div className={`text-gray-500 text-center py-8 italic rounded-lg border-2 border-dashed border-gray-300 ${
                dragOverColumn === column.id ? 'border-purple-400 bg-purple-50' : ''
              }`}>
                {dragOverColumn === column.id ? 
                  '🔥 Suelta aquí para mover' : 
                  `No hay tareas ${column.id === 'pendiente' ? 'pendientes' : 
                                column.id === 'en_progreso' ? 'en curso' : 'completadas'}`
                }
              </div>
            ) : (
              column.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projects={projects}
                  isDragged={draggedTask?.id === task.id}
                  onClick={() => draggedTask ? null : onTaskClick(task)}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onDragStart={handleDragStart}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanView;