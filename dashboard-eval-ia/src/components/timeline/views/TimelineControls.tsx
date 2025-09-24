import React from "react";
import { Project, ViewMode } from "../types/timeline";

interface TimelineControlsProps {
  projects: Project[];
  projectFilter: string;
  onProjectFilterChange: (filter: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  projects,
  projectFilter,
  onProjectFilterChange,
  viewMode,
  onViewModeChange,
}) => {
  const viewModeOptions = [
    { value: "days" as const, label: "Días" },
    { value: "weeks" as const, label: "Semanas" },
    { value: "months" as const, label: "Meses" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
        {/* Filtro de proyecto */}
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-800 mb-2">
            🔍 Filtrar por proyecto
          </label>
          <select
            value={projectFilter}
            onChange={(e) => onProjectFilterChange(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
          >
            <option value="">Todos los proyectos</option>
            <option value="sin-proyecto">Sin proyecto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id.toString()}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de vista */}
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-2">
            📅 Vista temporal
          </label>
          <div className="flex gap-2">
            {viewModeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onViewModeChange(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === option.value
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineControls;