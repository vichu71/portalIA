import React from "react";
import { Project } from "../services/projectService";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface Props {
  project: Project;
  onClose: () => void;
}

const ProjectDetailsModal: React.FC<Props> = ({ project, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
<DialogContent
  className="overflow-hidden p-6"
  style={{
    width: "95vw",
    maxWidth: "1200px",
    maxHeight: "90vh",
  }}
>
  {/* Título principal */}
  <div className="text-center mb-6">
    <h1 className="text-3xl font-bold text-blue-800">{project.name}</h1>
  </div>

  <hr className="mb-6 border-t border-gray-300" />

  {/* Contenido principal scrollable */}
  <div className="overflow-y-auto h-[65vh] space-y-6 pr-2">
    {/* Información general */}
    <div className="space-y-2">
      <p>
        <strong>📝 Descripción:</strong> {project.description}
      </p>
      <p>
        <strong>📌 Estado:</strong> {project.status}
      </p>
      <p>
        <strong>🧪 Tecnologías:</strong> {project.techStack}
      </p>
      <p>
        <strong>📅 Fecha de creación:</strong>{" "}
        {project.creationDate
          ? new Date(project.creationDate).toLocaleDateString()
          : "No disponible"}
      </p>
    </div>

    <hr className="border-t border-gray-300" />

    {/* Instrucciones de despliegue */}
    <div className="mt-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        📄 Instrucciones de Despliegue
      </h2>
      <div className="prose w-full bg-gray-50 p-4 rounded-md border border-gray-200 overflow-auto max-h-[40vh]">
        <ReactMarkdown>
          {project.informacion || "_Sin contenido disponible._"}
        </ReactMarkdown>
      </div>
    </div>
  </div>

  {/* Botón Cerrar */}
  <div className="flex justify-end mt-6">
    <button
      onClick={onClose}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded shadow"
    >
      Cerrar
    </button>
  </div>
</DialogContent>

  
</Dialog>

  );
};

export default ProjectDetailsModal;
