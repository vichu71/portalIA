import React from 'react';
import { Task } from '../../../services/taskService';
import { Project } from '../../../services/projectService';
import TaskRow from '../TaskRow';

interface TableViewProps {
  tasks: Task[];
  allTasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onEditTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
}

const TableView: React.FC<TableViewProps> = ({
  tasks,
  allTasks,
  projects,
  onTaskClick,
  onEditTask,
  onDeleteTask
}) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Tarea
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Asignado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Fecha Límite
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 italic">
                    {allTasks.length === 0 ? "No hay tareas registradas aún." : "No se encontraron tareas con los filtros aplicados."}
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    projects={projects}
                    onClick={() => onTaskClick(task)}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableView;