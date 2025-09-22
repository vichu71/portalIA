// components/CalendarNavigation.tsx
import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface CalendarNavigationProps {
  monthYear: string;
  isCurrentMonth: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  monthYear,
  isCurrentMonth,
  onPrevious,
  onNext,
  onToday
}) => {
  return (
    <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-sm border p-4">
      <button
        onClick={onPrevious}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
        title="Mes anterior"
      >
        <ChevronLeftIcon className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
      </button>
      
      <div className="flex items-center gap-4">
        <h4 className="text-2xl font-semibold text-gray-800">
          {monthYear}
        </h4>
        {!isCurrentMonth && (
          <button
            onClick={onToday}
            className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
            title="Ir al mes actual"
          >
            Hoy
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
        title="Mes siguiente"
      >
        <ChevronRightIcon className="w-6 h-6 text-gray-600 group-hover:text-gray-800" />
      </button>
    </div>
  );
};