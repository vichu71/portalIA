import React from 'react';
import { Filter } from 'lucide-react';
import { Project } from '../../services/projectService';
import { TaskFilters as ITaskFilters } from '../../hooks/useTaskManagement';
import { getProjectColor, getPrioritySelectColor, getPriorityEmoji } from '../../utils/taskUtils';

interface TaskFiltersProps {
  filters: ITaskFilters;
  setFilters: React.Dispatch<React.SetStateAction<ITaskFilters>>;
  projects: Project[];
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ filters, setFilters, projects }) => {
  const updateFilter = (key: keyof ITaskFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', project: '', priority: '' });
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-md border-2 border-gray-100 mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Filter className="w-6 h-6 text-purple-500" />
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar por título o descripción..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6">
          {/* Filtro de Proyecto */}
          <div className="lg:row-start-1 lg:col-start-1">
            <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">
              📁 PROYECTO
            </label>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${
                  filters.project === "" ? "bg-purple-400" :
                  filters.project === "sin-proyecto" ? "bg-gray-400" :
                  getProjectColor(projects.find(p => p.id.toString() === filters.project)?.name || "")
                } border-2 border-white shadow-md`} />
                <span className="text-sm font-medium text-gray-700">
                  {filters.project === "" ? "Todos los proyectos" :
                  filters.project === "sin-proyecto" ? "Sin proyecto asignado" :
                  projects.find(p => p.id.toString() === filters.project)?.name || "Proyecto desconocido"}
                </span>
              </div>

              <select
                value={filters.project}
                onChange={(e) => updateFilter('project', e.target.value)}
                className="w-full h-[48px] p-3 pl-12 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium bg-gradient-to-r from-white to-gray-50 appearance-none cursor-pointer"
              >
                <option value="">🔄 Todos los proyectos</option>
                <option value="sin-proyecto">⌀ Sin proyecto asignado</option>
                {projects.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id.toString()}>
                    📂 {proyecto.name}
                  </option>
                ))}
              </select>

              <div className="absolute left-4 top-[52px] -translate-y-1/2 pointer-events-none">
                <span className="text-gray-400 text-lg">📁</span>
              </div>
            </div>
          </div>

          {/* Filtro de Prioridad */}
          <div className="lg:row-start-1 lg:col-start-2">
            <label className="block text-sm font-bold text-gray-800 mb-2 tracking-wide">
              🎯 PRIORIDAD
            </label>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-4 h-4 rounded-full ${getPrioritySelectColor(filters.priority)} border-2 border-white shadow-md flex items-center justify-center`}>
                  <span className="text-xs">{getPriorityEmoji(filters.priority)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {filters.priority === "" ? "Todas las prioridades" :
                  filters.priority === "alta" ? "Prioridad Alta" :
                  filters.priority === "media" ? "Prioridad Media" :
                  filters.priority === "baja" ? "Prioridad Baja" : "Todas las prioridades"}
                </span>
              </div>

              <select
                value={filters.priority}
                onChange={(e) => updateFilter('priority', e.target.value)}
                className="w-full h-[48px] p-3 pl-12 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 font-medium bg-gradient-to-r from-white to-gray-50 appearance-none cursor-pointer"
              >
                <option value="">🔄 Todas las prioridades</option>
                <option value="alta">🔴 Prioridad Alta</option>
                <option value="media">🟡 Prioridad Media</option>
                <option value="baja">🟢 Prioridad Baja</option>
              </select>

              <div className="absolute left-4 top-[52px] -translate-y-1/2 pointer-events-none">
                <span className="text-gray-400 text-lg">🎯</span>
              </div>
            </div>
          </div>

          {/* Botón Limpiar */}
          <div className="lg:row-start-1 lg:col-start-3 lg:self-end">
            <button
              onClick={clearFilters}
              className="w-full lg:w-auto px-6 py-3 h-[48px] bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-bold rounded-xl border-2 border-gray-300 transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center justify-center gap-2"
              title="Limpiar todos los filtros"
            >
              <span className="text-lg">🧹</span>
              <span className="text-sm tracking-wide">LIMPIAR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskFilters;