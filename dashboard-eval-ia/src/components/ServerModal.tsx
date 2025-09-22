import React, { useState } from 'react'
import { addServer } from '../services/projectService';


interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const ServerModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    ip: '',
    os: '',
    notes: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
  if (!form.name.trim()) {
    alert('El nombre del servidor es obligatorio.');
    return;
  }

  try {
    await addServer(form);
    onSuccess();
    onClose();
  } catch (error: any) {
    alert(error.message || 'Error al crear servidor');
  }
};

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-lg font-semibold text-yellow-700">🖥️ Nuevo servidor</h2>

        <input
          className="w-full p-2 border rounded"
          name="name"
          placeholder="Nombre del servidor"
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
          placeholder="Sistema Operativo"
          value={form.os}
          onChange={handleChange}
        />

        <textarea
          className="w-full p-2 border rounded"
          name="notes"
          placeholder="Descripción"
          value={form.notes}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Crear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerModal;
