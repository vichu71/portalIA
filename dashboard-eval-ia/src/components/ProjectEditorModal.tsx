import React, { useEffect, useState } from "react";
import {
  addProject,
  updateProject,
  getProjectById,
} from "../services/projectService";

interface Props {
  projectId?: number; // si viene, se edita. Si no, se crea.
  onClose: () => void;
  onSuccess: () => void;
}

const ProjectEditorModal: React.FC<Props> = ({ projectId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "",
    tags: "",
    techStack: "",
    informacion: "",
  });
const [subiendoReadme, setSubiendoReadme] = useState(false);

  const [showWizard, setShowWizard] = useState(false);
  const [readmeExtras, setReadmeExtras] = useState({
    dependencies: "",
    usedBy: "",
    deploy: "",
    test: "",
    author: "",
    license: "",
  });

  useEffect(() => {
    if (projectId) {
      getProjectById(projectId).then((p) => {
        setForm({
          name: p.name || "",
          description: p.description || "",
          status: p.status || "",
          tags: p.tags || "",
          techStack: p.techStack || "",
          informacion: p.informacion || "",
        });
      });
    }
  }, [projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleExtrasChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReadmeExtras({ ...readmeExtras, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
  try {
    setSubiendoReadme(true); // ⏳ Empieza la subida
    if (projectId) {
      await updateProject({ id: projectId, ...form });
    } else {
      await addProject(form);
    }
    onSuccess();
    onClose();
  } catch (err: any) {
    alert(err.message || "Error al guardar el proyecto");
  } finally {
    setSubiendoReadme(false); // ✅ Termina la subida
  }
};


  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-blue-700">
          {projectId ? "✏️ Editar Proyecto" : "➕ Nuevo Proyecto"}
        </h2>

        <input
          className="w-full p-2 border rounded"
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={handleChange}
        />
        <textarea
          className="w-full p-2 border rounded"
          name="description"
          placeholder="Descripción"
          value={form.description}
          onChange={handleChange}
        />
        <input
          className="w-full p-2 border rounded"
          name="status"
          placeholder="Estado"
          value={form.status}
          onChange={handleChange}
        />
        <input
          className="w-full p-2 border rounded"
          name="tags"
          placeholder="Etiquetas"
          value={form.tags}
          onChange={handleChange}
        />
        <input
          className="w-full p-2 border rounded"
          name="techStack"
          placeholder="Stack tecnológico"
          value={form.techStack}
          onChange={handleChange}
        />

        <div>
          <h3 className="text-md font-semibold mb-1">📝 Instrucciones de Despliegue (Markdown)</h3>
          <textarea
            className="w-full h-60 p-3 border rounded font-mono text-sm"
            name="informacion"
            placeholder="Escribe aquí las instrucciones..."
            value={form.informacion}
            onChange={handleChange}
          />
{subiendoReadme && (
  <p className="text-sm text-blue-600 italic mt-1">⏳ Subiendo README.md a la IA...</p>
)}

          <div className="mt-4">
            <button
              onClick={() => setShowWizard((prev) => !prev)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showWizard ? "⬆️ Ocultar asistente para README" : "🧩 Usar asistente para generar README"}
            </button>
          </div>

          {showWizard && (
            <div className="mt-4 space-y-3 border border-blue-200 rounded p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-700 mb-2">🧠 Asistente para generar README</h4>

              <textarea
                name="dependencies"
                placeholder="Proyectos de los que depende"
                className="w-full p-2 border rounded text-sm"
                value={readmeExtras.dependencies}
                onChange={handleExtrasChange}
              />

              <textarea
                name="usedBy"
                placeholder="Proyectos que usan este"
                className="w-full p-2 border rounded text-sm"
                value={readmeExtras.usedBy}
                onChange={handleExtrasChange}
              />

              <textarea
                name="deploy"
                placeholder="Instrucciones de despliegue"
                className="w-full p-2 border rounded text-sm"
                value={readmeExtras.deploy}
                onChange={handleExtrasChange}
              />

              <textarea
                name="test"
                placeholder="Cómo probar el proyecto"
                className="w-full p-2 border rounded text-sm"
                value={readmeExtras.test}
                onChange={handleExtrasChange}
              />

              <input
                name="author"
                placeholder="Autor/es"
                className="w-full p-2 border rounded text-sm"
                value={readmeExtras.author}
                onChange={handleExtrasChange}
              />

              <input
                name="license"
                placeholder="Licencia (MIT, Apache, Propietaria...)"
                className="w-full p-2 border rounded text-sm"
                value={readmeExtras.license}
                onChange={handleExtrasChange}
              />

              <button
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                onClick={() => {
                  const markdown = `
# 📦 ${form.name}

## 🧠 Descripción General
${form.description}

## 🧩 Dependencias de Otros Proyectos
${readmeExtras.dependencies}

## 🔗 Proyectos que Dependen de Este
${readmeExtras.usedBy}

## ⚙️ Tecnologías Principales
${form.techStack}

## 🚀 Despliegue
${readmeExtras.deploy}

## 🧪 Cómo Probar
${readmeExtras.test}

## 👨‍💻 Autor
${readmeExtras.author}

## 📝 Licencia
${readmeExtras.license}
                  `.trim();

                  setForm((prev) => ({ ...prev, informacion: markdown }));
                  setShowWizard(false);
                }}
              >
                Generar README.md
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 items-center">
  <button
    onClick={onClose}
    className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
  >
    Cancelar
  </button>

  <button
    onClick={handleSave}
    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
    disabled={subiendoReadme}
  >
    {subiendoReadme && (
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
    {projectId ? "Guardar Cambios" : "Crear Proyecto"}
  </button>
</div>

      </div>
    </div>
  );
};

export default ProjectEditorModal;
