import React, { useEffect, useState } from "react";
import {
  getServerById,
  updateServer,
  addServer,
} from "../services/projectService";

interface Props {
  serverId?: number; // si viene, se edita. Si no, se crea.
  onClose: () => void;
  onSuccess: () => void;
}

const ServerEditorModal: React.FC<Props> = ({ serverId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    ip: "",
    os: "",
    notes: "",
  });

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
  if (serverId) {
    getServerById(serverId)
      .then((s) => {
        setForm({
          name: s.name || "",
          ip: s.ip || "",
          os: s.os || "",
          notes: s.notes || "",
        });
      })
      .catch((err) => {
        console.error("❌ Error al cargar servidor:", err);
        alert("No se pudo cargar la información del servidor.");
        onClose(); // Cierra el modal si hay error
      });
  }
}, [serverId]);

  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      setGuardando(true);
      if (serverId) {
        await updateServer(serverId, { id: serverId, ...form });

      } else {
        await addServer(form);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Error al guardar el servidor");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-yellow-700">
          {serverId ? "✏️ Editar Servidor" : "➕ Nuevo Servidor"}
        </h2>

        <input
          className="w-full p-2 border rounded"
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={handleChange}
        />
        <input
          className="w-full p-2 border rounded"
          name="ip"
          placeholder="Dirección IP"
          value={form.ip}
          onChange={handleChange}
        />
        <input
          className="w-full p-2 border rounded"
          name="os"
          placeholder="Sistema operativo"
          value={form.os}
          onChange={handleChange}
        />
        <textarea
          className="w-full p-2 border rounded"
          name="notes"
          placeholder="Notas"
          value={form.notes}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-2 items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center"
            disabled={guardando}
          >
            {guardando && (
              <svg
                className="animate-spin mr-2 h-4 w-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            )}
            {serverId ? "Guardar Cambios" : "Crear Servidor"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerEditorModal;