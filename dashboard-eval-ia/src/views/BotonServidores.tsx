import React, { useState, useEffect } from "react";
import { ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import { getServers, Server, deleteServer } from "../services/projectService";
import ServerModal from "../components/ServerModal";
import ServerEditorModal from "../components/ServerEditorModal";
import ConfirmModal from "../components/ConfirmModal";

interface BotonServidoresProps {
  isActive: boolean;
  onClick: () => void;
  onToastMessage: (message: string) => void;
  onlyContent?: boolean; // Nueva prop para renderizar solo contenido
}

const BotonServidores: React.FC<BotonServidoresProps> = ({
  isActive,
  onClick,
  onToastMessage,
  onlyContent = false, // Valor por defecto
}) => {
  // Estados locales
  const [servers, setServers] = useState<Server[]>([]);
  const [busquedaServidor, setBusquedaServidor] = useState("");
  const [selectedServerId, setSelectedServerId] = useState<number | null>(null);
  const [editingServerId, setEditingServerId] = useState<number | null>(null);
  const [showServerModal, setShowServerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cargar servidores cuando el componente se monta o cuando cambia la búsqueda
  useEffect(() => {
    if (isActive) {
      loadServer(busquedaServidor);
    }
  }, [isActive, busquedaServidor]);

  // Funciones
  const loadServer = (name: string = "") => {
    getServers(name)
      .then(setServers)
      .catch((err) => console.error("Error cargando servidores:", err));
  };

  const handleDeleteServer = (serverId: number) => {
    setSelectedServerId(serverId);
    setShowConfirmModal(true);
  };

  const confirmDeleteServer = async () => {
    if (!selectedServerId) return;
    try {
      await deleteServer(selectedServerId);
      onToastMessage("Servidor eliminado correctamente");
      loadServer(busquedaServidor);
    } catch (error) {
      console.error("Error al eliminar servidor:", error);
      onToastMessage("⚠ Error al eliminar servidor");
    } finally {
      setShowConfirmModal(false);
      setSelectedServerId(null);
    }
  };

  const handleServerModalSuccess = () => {
    setShowServerModal(false);
    onToastMessage("Servidor creado correctamente");
    loadServer(busquedaServidor);
  };

  const handleServerEditorSuccess = () => {
    loadServer(busquedaServidor);
    setEditingServerId(null);
    onToastMessage("Servidor actualizado correctamente");
  };

  // Si onlyContent es true, renderizar solo el contenido
  if (onlyContent) {
    return (
      <>
        <h3 className="text-4xl font-bold text-orange-700 text-center mb-4">
          🖥️ Lista de Servidores
        </h3>
        <div className="flex justify-center mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busquedaServidor}
            onChange={(e) => setBusquedaServidor(e.target.value)}
            className="w-full max-w-md p-2 border rounded shadow-sm"
          />
        </div>
        <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
          {servers.length === 0 ? (
            <p className="text-gray-500 text-center italic">
              No hay servidores registrados aún.
            </p>
          ) : (
            servers.map((s) => (
              <div
                key={s.id}
                className="bg-white hover:bg-orange-50 transition rounded-xl px-5 py-4 shadow border border-gray-200 relative"
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
                        setEditingServerId(s.id);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteServer(s.id);
                      }}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <h3 className="text-lg font-semibold text-gray-800">
                  {s.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">IP: {s.ip}</p>
                <p className="text-sm text-gray-500 mt-1">SO: {s.os}</p>
                <p className="text-xs text-gray-400 mt-1 italic">
                  {s.notes}
                </p>
              </div>
            ))
          )}
        </div>

        <button
          onClick={() => setShowServerModal(true)}
          className="fixed bottom-8 right-8 bg-orange-400 hover:bg-orange-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
          title="Añadir Servidor"
        >
          <ComputerDesktopIcon className="w-6 h-6" />
        </button>

        {/* Modales */}
        {showServerModal && (
          <ServerModal
            onClose={() => setShowServerModal(false)}
            onSuccess={handleServerModalSuccess}
          />
        )}

        {editingServerId !== null && (
          <ServerEditorModal
            serverId={editingServerId}
            onClose={() => setEditingServerId(null)}
            onSuccess={handleServerEditorSuccess}
          />
        )}

        <ConfirmModal
          open={showConfirmModal}
          title="Eliminar servidor"
          message="¿Estás seguro de que deseas eliminar este servidor?"
          onConfirm={confirmDeleteServer}
          onCancel={() => {
            setShowConfirmModal(false);
            setSelectedServerId(null);
          }}
        />
      </>
    );
  }

  // Si no está activo, solo renderizar el botón de navegación
  if (!isActive) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-orange-300 hover:bg-orange-400 shadow-lg text-white text-sm transition-all duration-200"
        >
          <ComputerDesktopIcon className="w-8 h-8 mb-1" />
          <span className="font-medium">Servidores</span>
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
          className="w-24 h-24 flex flex-col items-center justify-center rounded-xl bg-orange-300 hover:bg-orange-400 shadow-lg text-white text-sm transition-all duration-200 relative z-10 ring-4 ring-offset-2 ring-orange-200 shadow-orange-200/70 shadow-xl"
          style={{ transform: "scale(1.2)" }}
        >
          <ComputerDesktopIcon className="w-10 h-10 mb-1" />
          <span className="font-medium">Servidores</span>
        </button>
      </div>

      {/* Vista de contenido */}
      <div className="mt-10 relative">
        <div className="min-h-96">
          <div className="relative">
            <h3 className="text-4xl font-bold text-orange-700 text-center mb-4">
              🖥️ Lista de Servidores
            </h3>
            <div className="flex justify-center mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busquedaServidor}
                onChange={(e) => setBusquedaServidor(e.target.value)}
                className="w-full max-w-md p-2 border rounded shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-4 max-w-xl mx-auto w-full">
              {servers.length === 0 ? (
                <p className="text-gray-500 text-center italic">
                  No hay servidores registrados aún.
                </p>
              ) : (
                servers.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white hover:bg-orange-50 transition rounded-xl px-5 py-4 shadow border border-gray-200 relative"
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
                            setEditingServerId(s.id);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteServer(s.id);
                          }}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <h3 className="text-lg font-semibold text-gray-800">
                      {s.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">IP: {s.ip}</p>
                    <p className="text-sm text-gray-500 mt-1">SO: {s.os}</p>
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {s.notes}
                    </p>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowServerModal(true)}
              className="fixed bottom-8 right-8 bg-orange-400 hover:bg-orange-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl"
              title="Añadir Servidor"
            >
              <ComputerDesktopIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showServerModal && (
        <ServerModal
          onClose={() => setShowServerModal(false)}
          onSuccess={handleServerModalSuccess}
        />
      )}

      {editingServerId !== null && (
        <ServerEditorModal
          serverId={editingServerId}
          onClose={() => setEditingServerId(null)}
          onSuccess={handleServerEditorSuccess}
        />
      )}

      <ConfirmModal
        open={showConfirmModal}
        title="Eliminar servidor"
        message="¿Estás seguro de que deseas eliminar este servidor?"
        onConfirm={confirmDeleteServer}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedServerId(null);
        }}
      />
    </>
  );
};

export default BotonServidores;