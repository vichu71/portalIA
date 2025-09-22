import React, { useState, useEffect } from "react";
import { DocumentIcon } from "@heroicons/react/24/solid";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { getProjects, Project, deleteProject } from "../services/projectService";
import ProjectEditorModal from "../components/ProjectEditorModal";
import ProjectDetailsModal from "../components/ProjectDetailsModal";
import ConfirmModal from "../components/ConfirmModal";

interface BotonProyectosProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean; // Nueva prop para renderizar solo contenido
}

const BotonProyectos: React.FC<BotonProyectosProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false, // Valor por defecto
}) => {
  // Estados locales
  const [proyectos, setProyectos] = useState<Project[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cargar proyectos cuando el componente se monta o cuando cambia la búsqueda
  useEffect(() => {
    if (isActive) {
      loadProjects(busqueda);
    }
  }, [isActive, busqueda]);

  // Funciones
  const loadProjects = (name: string = "") => {
    getProjects(name)
      .then(setProyectos)
      .catch((err) => console.error("Error cargando proyectos:", err));
  };

  const handleDeleteProject = (projectId: number) => {
    setSelectedProjectId(projectId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedProjectId) return;
    try {
      await deleteProject(selectedProjectId);
      onToastMessage("Proyecto eliminado correctamente");
      loadProjects(busqueda);
    } catch (error) {
      console.error("Error al eliminar:", error);
      if (error instanceof Error) {
        onToastMessage("⚠ " + error.message);
      } else {
        onToastMessage("⚠ Error desconocido");
      }
    } finally {
      setShowConfirmModal(false);
      setSelectedProjectId(null);
    }
  };

  const handleSuccess = (message: string) => {
    loadProjects(busqueda);
    setCreatingProject(false);
    setEditingProjectId(null);
    onToastMessage(message);
  };

  // Si onlyContent es true, renderizar solo el contenido
  if (onlyContent) {
    return (
      <>
        <h3 className="text-4xl font-bold text-blue-700 mb-4 text-center">
          📋 Lista de Proyectos
        </h3>
        <div className="flex justify-center mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full max-w-md p-2 border rounded shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
          {proyectos.length === 0 ? (
            <p className="text-gray-500 text-center">
              No hay proyectos registrados aún.
            </p>
          ) : (
            proyectos.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className="bg-white hover:bg-blue-50 transition rounded-xl px-5 py-4 shadow border border-gray-200 relative cursor-pointer"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProjectId(p.id);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(p.id);
                      }}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <h3 className="text-lg font-semibold text-gray-800">
                  {p.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {p.description}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {p.status}
                  </span>
                  <span className="text-xs text-gray-400 italic">
                    Stack: {p.techStack}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setCreatingProject(true)}
          className="fixed bottom-8 right-8 bg-cyan-400 hover:bg-cyan-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
          title="Añadir Proyecto"
        >
          +
        </button>

        {/* Modales */}
        {(creatingProject || editingProjectId !== null) && (
          <ProjectEditorModal
            projectId={editingProjectId ?? undefined}
            onClose={() => {
              setCreatingProject(false);
              setEditingProjectId(null);
            }}
            onSuccess={() => handleSuccess("Proyecto guardado correctamente")}
          />
        )}

        <ConfirmModal
          open={showConfirmModal}
          title="Eliminar proyecto"
          message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer."
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowConfirmModal(false);
            setSelectedProjectId(null);
          }}
        />

        {selectedProject && (
          <ProjectDetailsModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </>
    );
  }

  // Si no está activo, solo renderizar el botón de navegación
  if (!isActive) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-cyan-400 hover:bg-cyan-500 shadow-lg text-white text-sm transition-all duration-200"
        >
          <DocumentIcon className="w-7 h-7 mb-1" />
          <span className="font-medium">Proyectos</span>
        </button>
      </div>
    );
  }

  // Vista completa cuando está activo
  return (
    <>
      {/* Botón de navegación activo */}
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-cyan-400 hover:bg-cyan-500 shadow-lg text-white text-sm transition-all duration-200 relative z-10 ring-4 ring-offset-2 ring-cyan-200 shadow-cyan-200/70 shadow-xl"
          style={{ transform: "scale(1.2)" }}
        >
          <DocumentIcon className="w-9 h-9 mb-1" />
          <span className="font-medium">Proyectos</span>
        </button>
      </div>

      {/* Vista de contenido */}
      <div className="mt-10 relative">
        <div className="min-h-96">
          <div>
            <h3 className="text-4xl font-bold text-blue-700 mb-4 text-center">
              📋 Lista de Proyectos
            </h3>
            <div className="flex justify-center mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full max-w-md p-2 border rounded shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
              {proyectos.length === 0 ? (
                <p className="text-gray-500 text-center">
                  No hay proyectos registrados aún.
                </p>
              ) : (
                proyectos.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className="bg-white hover:bg-blue-50 transition rounded-xl px-5 py-4 shadow border border-gray-200 relative cursor-pointer"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProjectId(p.id);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(p.id);
                          }}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <h3 className="text-lg font-semibold text-gray-800">
                      {p.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {p.description}
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {p.status}
                      </span>
                      <span className="text-xs text-gray-400 italic">
                        Stack: {p.techStack}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setCreatingProject(true)}
              className="fixed bottom-8 right-8 bg-cyan-400 hover:bg-cyan-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
              title="Añadir Proyecto"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      {(creatingProject || editingProjectId !== null) && (
        <ProjectEditorModal
          projectId={editingProjectId ?? undefined}
          onClose={() => {
            setCreatingProject(false);
            setEditingProjectId(null);
          }}
          onSuccess={() => handleSuccess("Proyecto guardado correctamente")}
        />
      )}

      <ConfirmModal
        open={showConfirmModal}
        title="Eliminar proyecto"
        message="¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedProjectId(null);
        }}
      />

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </>
  );
};

export default BotonProyectos;