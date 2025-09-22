// components/DailyNoteModal.tsx
import React from "react";
import { XMarkIcon, PencilIcon } from "@heroicons/react/24/outline";

interface DailyNoteModalProps {
  isOpen: boolean;
  selectedDate: string;
  noteContent: string;
  isSaving: boolean;
  onClose: () => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  formatDateForDisplay: (dateString: string) => string;
}

export const DailyNoteModal: React.FC<DailyNoteModalProps> = ({
  isOpen,
  selectedDate,
  noteContent,
  isSaving,
  onClose,
  onContentChange,
  onSave,
  formatDateForDisplay
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header del modal */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              📝 Notas del día
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {formatDateForDisplay(selectedDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿En qué punto me quedé? ¿Qué hay que hacer?
            </label>
            <textarea
              value={noteContent}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Ej: Me quedé implementando el login, falta el CSS del formulario y conectar con la API. También hay que subir a producción..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              autoFocus
              disabled={isSaving}
            />
          </div>
          
          <div className="text-xs text-gray-500 mb-4">
            {noteContent.length} caracteres
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PencilIcon className="w-4 h-4" />
              {isSaving ? "Guardando..." : "Guardar nota"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};