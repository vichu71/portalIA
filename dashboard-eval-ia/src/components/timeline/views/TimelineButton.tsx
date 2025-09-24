import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";

interface TimelineButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const TimelineButton: React.FC<TimelineButtonProps> = ({
  isActive,
  onClick,
}) => {
  if (isActive) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-blue-400 hover:bg-blue-500 shadow-lg text-white text-sm transition-all duration-200 relative z-10 ring-4 ring-offset-2 ring-blue-200 shadow-blue-200/70 shadow-xl"
          style={{ transform: "scale(1.2)" }}
        >
          <ChartBarIcon className="w-9 h-9 mb-1" />
          <span className="font-medium">Timeline</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-blue-400 hover:bg-blue-500 shadow-lg text-white text-sm transition-all duration-200"
      >
        <ChartBarIcon className="w-7 h-7 mb-1" />
        <span className="font-medium">Timeline</span>
      </button>
    </div>
  );
};

export default TimelineButton;