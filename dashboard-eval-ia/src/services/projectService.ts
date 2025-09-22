
const BASE_URL = 'http://localhost:8081';


export interface Environment {
  id: number;
  name: string;
  description: string;
  server: Server;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  tags: string;
  techStack: string;
  documento?: string; // si usas este campo
  environments: Environment[];
  informacion:string;
  creationDate:Date;
}

export interface Environment {
  id: number;
  type: string;
  deployInstructions: string;
  commands: string;
  server: Server;
  project: { id: number; name: string };
}
export interface Server {
  id: number;
  name: string;
  ip: string;
  os: string;
  notes: string;
}


// export const getServers = async (): Promise<Server[]> => {
//   const res = await fetch(`${BASE_URL}/api/server/list`);
//   if (!res.ok) throw new Error('Error al cargar servidores');
//   return res.json();
// };
export const getServers = async (name: string = ""): Promise<Server[]> => {
  const url = new URL(`${BASE_URL}/api/server`);
  if (name) {
    url.searchParams.append("name", name);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("No se pudo cargar la lista de Server");
  const data = await res.json();

  // ⚠️ Si el backend devuelve una Page, extrae el contenido
  return data.content || [];
};

export const getEnvironments = async (): Promise<Environment[]> => {
  const res = await fetch(`${BASE_URL}/api/environment/list`);
  if (!res.ok) throw new Error('Error al cargar entornos');
  return res.json();
};
  
 /* export const getProjects = async (): Promise<Project[]> => {
    const res = await fetch(`${BASE_URL}/api/projects/list`);
    if (!res.ok) throw new Error("No se pudo cargar la lista de proyectos");
    return res.json();
  };*/

export const getProjects = async (name: string = ""): Promise<Project[]> => {
  const url = new URL(`${BASE_URL}/api/projects`);
  if (name) {
    url.searchParams.append("name", name);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("No se pudo cargar la lista de proyectos");
  const data = await res.json();

  // ⚠️ Si el backend devuelve una Page, extrae el contenido
  return data.content || [];
};


export const deleteProject = async (id: number) => {
  const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "No se pudo eliminar el proyecto");
  }

  return true;
};

export const addProject = async (project: Partial<Project>) => {
  const res = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al crear proyecto: ${errorText}`);
  }

  return res.json(); // ⬅️ Devuelve el proyecto creado
};

export const addServer = async (server: Partial<Server>) => {
  const res = await fetch(`${BASE_URL}/api/server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(server),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al crear el servidor: ${errorText}`);
  }

  return res.json(); // ⬅️ Devuelve el servidor creado
};

export const addEnvironment = async (environment: Partial<Environment>) => {
  const res = await fetch(`${BASE_URL}/api/environment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(environment),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al crear el environment: ${errorText}`);
  }

  return res.json(); // ⬅️ Devuelve el environment creado
};

export const getProjectById = async (id: number): Promise<Project> => {
  const res = await fetch(`${BASE_URL}/api/projects/${id}`);
  if (!res.ok) throw new Error('Error al cargar proyecto');
  return res.json();
};



export const updateProjectMd = async (id: number, markdown: string) => {
  const res = await fetch(`${BASE_URL}/api/projects/${id}/md`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ informacion: markdown }),
  });
  if (!res.ok) throw new Error("Error al actualizar el documento");
};

export const updateProject = async (project: any) => {
  const { id, ...data } = project;
  const res = await fetch(`${BASE_URL}/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Error al actualizar el proyecto");
  }

  return await res.json();
};

export const deleteServer = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/server/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("No se pudo eliminar el servidor");
  }
};

export const getServerById = async (id: number): Promise<Server> => {
  const res = await fetch(`${BASE_URL}/api/server/${id}`);
  if (!res.ok) throw new Error("No se pudo obtener el servidor");
  return res.json();
};

export const updateServer = async (id: number, data: Server): Promise<void> => {
  const res = await fetch(`${BASE_URL}/api/server/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("No se pudo actualizar el servidor");
};



 