import { Project } from '../services/projectService';

export const getProjectName = (projectId: number | undefined, projects: Project[]) => {
  if (!projectId) return null;
  const project = projects.find((p) => p.id === projectId);
  return project ? project.name : `Proyecto #${projectId}`;
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "alta":
      return "bg-red-100 text-red-800";
    case "media":
      return "bg-yellow-100 text-yellow-800";
    case "baja":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "completada":
      return "bg-green-100 text-green-800";
    case "en_progreso":
      return "bg-blue-100 text-blue-800";
    case "pendiente":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getPrioritySelectColor = (priority: string) => {
  switch (priority) {
    case "alta":
      return "bg-red-500";
    case "media":
      return "bg-yellow-500";
    case "baja":
      return "bg-green-500";
    default:
      return "bg-purple-400";
  }
};

export const getPriorityEmoji = (priority: string) => {
  switch (priority) {
    case "alta":
      return "🔴";
    case "media":
      return "🟡";
    case "baja":
      return "🟢";
    default:
      return "🔄";
  }
};

export const getProjectColor = (projectName: string) => {
  if (!projectName) return "bg-gray-400";
  
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", 
    "bg-pink-500", "bg-indigo-500", "bg-red-500", "bg-teal-500",
    "bg-orange-500", "bg-cyan-500", "bg-lime-500", "bg-amber-500"
  ];
  
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getStatusDisplayName = (status: string) => {
  switch (status) {
    case 'en_progreso':
      return 'En Progreso';
    case 'pendiente':
      return 'Pendiente';
    case 'completada':
      return 'Completada';
    default:
      return status;
  }
};