import React, { useState, useEffect } from 'react';
import { getProjects, getServers, addEnvironment, Project, Server, Environment } from '../services/projectService';

interface Props {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const EnvironmentModal: React.FC<Props> = ({ projectId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    type: '',
    deployInstructions: '',
    commands: '',
    projectId: '',
    serverId: ''
  });

  const [servers, setServers] = useState<Server[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    getServers()
      .then(setServers)
      .catch(() => alert('Error al cargar servidores'));

    getProjects()
      .then(setProjects)
      .catch(() => alert('Error al cargar proyectos'));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    if (!form.type.trim()) {
      alert('El tipo del entorno es obligatorio.');
      return;
    }

    const environment = {
      type: form.type,
      deployInstructions: form.deployInstructions,
      commands: form.commands,
      ...(form.projectId && { project: { id: parseInt(form.projectId) } }),
      ...(form.serverId && { server: { id: parseInt(form.serverId) } })
    } as Partial<Environment>;

    try {
      await addEnvironment(environment);
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Error al crear entorno');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg space-y-4">
        <h2 className="text-lg font-semibold">➕ Nuevo entorno</h2>

        <input
          name="type"
          placeholder="Tipo (dev, test, prod)"
          value={form.type}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <textarea
          name="deployInstructions"
          placeholder="Instrucciones de despliegue"
          value={form.deployInstructions}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <textarea
          name="commands"
          placeholder="Comandos"
          value={form.commands}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        {/* Selector de Proyecto */}
        <select className="w-full p-2 border rounded" name="projectId" value={form.projectId} onChange={handleChange}>
          <option value="">Selecciona un proyecto</option>
          {projects.length === 0 ? (
            <option disabled value="">Vacío</option>
          ) : (
            projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))
          )}
        </select>

        {/* Selector de Servidor */}
        <select className="w-full p-2 border rounded" name="serverId" value={form.serverId} onChange={handleChange}>
          <option value="">Selecciona un servidor</option>
          {servers.length === 0 ? (
            <option disabled value="">Vacío</option>
          ) : (
            servers.map(server => (
              <option key={server.id} value={server.id}>
                {server.name} ({server.ip})
              </option>
            ))
          )}
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
          <button onClick={handleCreate} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Crear</button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentModal;
