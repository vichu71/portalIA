import React from 'react';

export type ViewType = 'kanban' | 'table';

interface ViewSelectorProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

const ViewSelector: React.FC<ViewSelectorProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border p-4 mb-6">
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setCurrentView('kanban')}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            currentView === 'kanban'
              ? "bg-purple-500 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          Vista Kanban
        </button>
        <button
          onClick={() => setCurrentView('table')}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            currentView === 'table'
              ? "bg-purple-500 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-9 8h9M3 14h18M3 18h18" />
          </svg>
          Vista Tabla
        </button>
      </div>
    </div>
  );
};

export default ViewSelector;