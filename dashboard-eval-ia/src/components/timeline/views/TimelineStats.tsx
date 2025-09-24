import React from "react";
import { Task } from "../types/timeline";
import { getTaskStatusDescription } from "../../../utils/timelineUtils";

interface TimelineStatsProps {
  tasks: Task[];
}

const TimelineStats: React.FC<TimelineStatsProps> = ({ tasks }) => {
  const stats = React.useMemo(() => {
    const now = new Date();
    
    const completed = tasks.filter(task => task.status === "completada").length;
    
    const overdue = tasks.filter(task => {
      if (task.status === "completada") return false;
      const dueDate = new Date(task.dueDate!);
      return dueDate < now;
    }).length;
    
    const inProgress = tasks.filter(task => {
      if (task.status === "completada") return false;
      const startDate = new Date(task.createdAt!);
      const dueDate = new Date(task.dueDate!);
      return startDate <= now && dueDate >= now;
    }).length;
    
    const upcoming = tasks.filter(task => {
      if (task.status === "completada") return false;
      const startDate = new Date(task.createdAt!);
      return startDate > now;
    }).length;
    
    const total = tasks.length;
    
    return { completed, overdue, inProgress, upcoming, total };
  }, [tasks]);

  if (stats.total === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border p-4 mb-6">
      <h4 className="font-semibold text-gray-800 mb-3">📊 Resumen del Timeline</h4>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-green-700">Completadas ✅</div>
          <div className="text-xs text-green-600">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
          <div className="text-xs text-amber-700">En progreso ⏰</div>
          <div className="text-xs text-amber-600">
            {stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%
          </div>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-xs text-red-700">Atrasadas 🚨</div>
          <div className="text-xs text-red-600">
            {stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0}%
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
          <div className="text-xs text-blue-700">Por comenzar 📅</div>
          <div className="text-xs text-blue-600">
            {stats.total > 0 ? Math.round((stats.upcoming / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>
      
      {/* Barra de progreso visual */}
      <div className="mt-4">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
          {stats.completed > 0 && (
            <div 
              className="bg-green-500" 
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          )}
          {stats.inProgress > 0 && (
            <div 
              className="bg-amber-500" 
              style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
            />
          )}
          {stats.overdue > 0 && (
            <div 
              className="bg-red-500" 
              style={{ width: `${(stats.overdue / stats.total) * 100}%` }}
            />
          )}
          {stats.upcoming > 0 && (
            <div 
              className="bg-blue-500" 
              style={{ width: `${(stats.upcoming / stats.total) * 100}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineStats;