import React, { useState } from 'react';
import { addProject } from '../services/projectService';


interface Props {
  onClose: () => void;
  onSuccess: (project: any) => void;
}

const ProjectModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: '',
    tags: '',
    techStack: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
  try {
    const created = await addProject(form);
    onSuccess(created);
    onClose();
  } catch (err: any) {
    alert(err.message || 'Error al crear proyecto');
  }
};


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">➕ Nuevo proyecto</h2>

        <input className="w-full p-2 border rounded" name="name" placeholder="Nombre" value={form.name} onChange={handleChange} />
        <textarea className="w-full p-2 border rounded" name="description" placeholder="Descripción" value={form.description} onChange={handleChange} />

        <input className="w-full p-2 border rounded" name="status" placeholder="Estado (ej. activo)" value={form.status} onChange={handleChange} />
        <input className="w-full p-2 border rounded" name="tags" placeholder="Etiquetas" value={form.tags} onChange={handleChange} />
        <input className="w-full p-2 border rounded" name="techStack" placeholder="Stack tecnológico" value={form.techStack} onChange={handleChange} />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
          <button onClick={handleCreate} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Crear</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
