import React, { useState, useEffect } from "react";
import { updateProjectMd, getProjectById } from "../services/projectService";

interface Props {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const MarkdownEditorModal: React.FC<Props> = ({ projectId, onClose, onSuccess }) => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    getProjectById(projectId).then((project) => {
      setMarkdown(project.informacion || "");
    });
  }, [projectId]);

  const handleSave = async () => {
    await updateProjectMd(projectId, markdown);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-3xl shadow space-y-4">
        <h2 className="text-lg font-bold">📝 Editar instrucciones de despliegue</h2>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="w-full h-80 p-3 border rounded font-mono text-sm"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditorModal;
