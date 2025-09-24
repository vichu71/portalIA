import React from "react";
import { ViewMode, DateRange } from "../types/timeline";
import {
  getDayPosition,
  shouldShowDayLabel,
  formatIntervalLabel,
} from "../../../utils/timelineUtils";

interface TimelineHeaderProps {
  dailyGrid: Date[];
  dateRange: DateRange;
  viewMode: ViewMode;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  dailyGrid,
  dateRange,
  viewMode,
}) => {
  return (
    <div className="bg-gray-50 border-b">
      <div className="flex">
        <div className="w-80 p-4 border-r bg-gray-100">
          <span className="font-bold text-gray-700">Tarea</span>
        </div>
        <div className="flex-1 relative overflow-hidden pr-4">
          {/* Cuadrícula de días de fondo */}
          <div className="absolute inset-0">
            {dailyGrid.map((day, index) => (
              <div
                key={index}
                className="absolute top-0 bottom-0"
                style={{
                  left: `calc(${getDayPosition(day, dateRange)}% - ${
                    getDayPosition(day, dateRange) * 0.15
                  }px)`,
                  borderLeft: shouldShowDayLabel(day, viewMode, dateRange)
                    ? "2px solid #D1D5DB"
                    : "1px solid #F3F4F6",
                }}
              />
            ))}
          </div>

          {/* Etiquetas de fechas */}
          <div className="relative h-16 flex items-center">
            {dailyGrid
              .filter((day) => shouldShowDayLabel(day, viewMode, dateRange))
              .map((day, index) => (
                <div
                  key={index}
                  className="absolute text-xs font-mono text-gray-600 transform -translate-x-1/2"
                  style={{ left: `${getDayPosition(day, dateRange)}%` }}
                >
                  <div className="bg-white px-1 py-0.5 rounded border shadow-sm">
                    {formatIntervalLabel(day, viewMode)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineHeader;