// Variables globales
let projects = [];
let currentProject = null;
let projectStates = {};
let editingProjectId = null;
let serviceCounter = 0;
let autoScrollEnabled = true;

// Función para cargar proyectos
async function loadProjects() {
  try {
    projects = await window.api.loadProjects();
    console.log("[TRACE] Proyectos cargados:", projects);
    initializeProjectStates(); // 🔥 Inicializa los estados de los proyectos cargados
    renderProjectsList();
  } catch (error) {
    console.error("Error al cargar proyectos:", error);
  }
}

// Inicializar estados de proyectos
function initializeProjectStates() {
  projects.forEach((project) => {
    if (!projectStates[project.id]) {
      projectStates[project.id] = {
        services: {},
        consoleOutput: [],
      };
      project.services.forEach((service) => {
        projectStates[project.id].services[service.id] = {
          ready: false,
          running: false,
          process: null,
        };
      });
    }
  });
}

// 🚀 Versión final para evitar errores al no encontrar el botón
document.addEventListener("DOMContentLoaded", () => {
  console.log("[TRACE] DOMContentLoaded");

  try {
    loadProjects();
  } catch (error) {
    console.error("[ERROR] Al cargar proyectos:", error);
  }

  const addProjectBtn = document.getElementById("addProjectBtn");
  if (addProjectBtn) {
    addProjectBtn.addEventListener("click", () => {
      console.log("[DEBUG] Botón + pulsado");
      try {
        if (typeof openProjectModal === "function") {
          openProjectModal();
        } else {
          console.error("[ERROR] openProjectModal no está definido");
        }
      } catch (error) {
        console.error("[ERROR] Al abrir modal:", error);
      }
    });
  } else {
    console.warn("[WARN] No se encontró el botón addProjectBtn");
  }

  const closeBtn = document.querySelector(".close-btn");
  const cancelBtn = document.querySelector(".modal-footer .btn-secondary");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => closeProjectModal());
  } else {
    console.warn("[WARN] No se encontró close-btn");
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => closeProjectModal());
  } else {
    console.warn("[WARN] No se encontró cancel-btn");
  }

  const autoScrollCheckbox = document.getElementById("autoScrollCheckbox");
  if (autoScrollCheckbox) {
    autoScrollCheckbox.addEventListener("change", (e) => {
      autoScrollEnabled = e.target.checked;
    });
  } else {
    console.warn("[WARN] No se encontró autoScrollCheckbox");
  }

  const exportBtn = document.querySelector(".export-console");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportConsoleLogs);
  } else {
    console.warn("[WARN] No se encontró export-console");
  }
});

// Función para guardar proyectos
async function saveProjects() {
  try {
    await window.api.saveProjects(projects);
  } catch (error) {
    console.error("Error guardando proyectos:", error);
    alert("Error al guardar la configuración de proyectos");
  }
}

// Función para generar ID único
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function renderProjectsList() {
  const listContainer = document.getElementById("projectsList");
  listContainer.innerHTML = "";

  projects.forEach((project) => {
    const projectItem = document.createElement("div");
    projectItem.className = "project-item";

    const runningServices = project.services.filter(
      (s) => projectStates[project.id]?.services[s.id]?.running
    ).length;
    const totalServices = project.services.length;

    // Estado global
    let globalStatusClass = "status-stopped";
    let globalStatusIcon = "🔴";
    if (runningServices === totalServices && totalServices > 0) {
      globalStatusClass = "status-running";
      globalStatusIcon = "🟢";
    } else if (runningServices > 0) {
      globalStatusClass = "status-partial";
      globalStatusIcon = "🟡";
    }

    projectItem.innerHTML = `
      <span class="project-item-icon">${project.icon}</span>
      <div class="project-item-info">
      <div class="project-last-started" style="font-size: 11px; color: #6b7280;">
  Último arranque: ${
    project.lastStartedAt
      ? new Date(project.lastStartedAt).toLocaleString()
      : "Nunca"
  }
</div>

        <div class="project-item-name">
          ${project.name}
          <span class="global-status-icon ${globalStatusClass}" title="Estado global">${globalStatusIcon}</span>
        </div>
        <div class="project-item-status" id="status-${project.id}">
          <span class="status-dot ${
            runningServices > 0 ? "running" : "stopped"
          }"></span> 
          ${runningServices}/${totalServices} servicios activos
        </div>
      </div>
    `;

    projectItem.addEventListener("click", function () {
      selectProject(project, this);
    });
    listContainer.appendChild(projectItem);
  });
}

async function selectProject(project) {
  currentProject = project;

  const portsToCheck = project.services
    .filter((service) => service.port)
    .map((service) => service.port);

  console.log("[TRACE renderer.js] Enviando puertos a comprobar:", portsToCheck);
  const portsInUse = await window.api.checkPortsInUse(portsToCheck);
  console.log("[TRACE renderer.js] Respuesta de puertos en uso:", portsInUse);

  project.services.forEach((service) => {
    const isRunning = service.port && portsInUse[service.port];
    projectStates[project.id].services[service.id].running = isRunning;
    projectStates[project.id].services[service.id].ready = isRunning;
    service.running = isRunning;
    service.ready = isRunning;
  });

  // 🔥 Actualiza la UI del panel del proyecto
  renderProjectPanel(project);

  // 🔥 También actualiza la lista lateral con los estados actualizados
  renderProjectsList();
}




// Renderizar panel del proyecto
function renderProjectPanel(project) {
  const contentContainer = document.getElementById("projectContent");
  const template = document.getElementById("projectTemplate");
  const clone = template.content.cloneNode(true);
  const projectPanel = document.querySelector(".project-panel");

  // Actualizar información del proyecto
  clone.querySelector(".project-icon").textContent = project.icon;
  clone.querySelector(".project-name").textContent = project.name;
  clone.querySelector(".project-description").textContent = project.description;
  clone.querySelector(".project-description").insertAdjacentHTML(
    "beforeend",
    `<div class="last-started-at" style="margin-top: 8px; font-size: 12px; color: #9ca3af;">
    Último arranque: ${
      project.lastStartedAt
        ? new Date(project.lastStartedAt).toLocaleString()
        : "Nunca"
    }
  </div>`
  );

  contentContainer.innerHTML = "";
  contentContainer.appendChild(clone);

  // Renderizar grid de servicios
  renderServicesGrid(project);

  // Configurar filtro de consola
  setupConsoleFilter(project);

  // Configurar event listeners
  setupProjectControls(project);
// Rellena el combo con los puertos de los servicios del proyecto
const portInput = document.getElementById("portSelectInput");
const portOptions = document.getElementById("portOptions");
portOptions.innerHTML = "";
project.services.forEach((service) => {
  if (service.port) {
    const option = document.createElement("option");
    option.value = service.port;
    option.label = `${service.name} (${service.port})`; // opcional
    portOptions.appendChild(option);
  }
});

stopPortBtn.addEventListener("click", () => {
  const portToKill = portInput.value;
  if (!portToKill) {
    alert("Por favor, selecciona o introduce un puerto.");
    return;
  }

  // Envía el evento al main
  window.api.stopPort(parseInt(portToKill));
  // 🔥 Después de detener el puerto, actualizar el estado interno
const service = currentProject.services.find(s => s.port === parseInt(portToKill));
if (service) {
  projectStates[currentProject.id].services[service.id].running = false;
  projectStates[currentProject.id].services[service.id].ready = false;
  service.running = false;
  service.ready = false;
}

// 🔧 Y forzar el re-render de la UI
renderProjectPanel(currentProject);

});


  // Restaurar consola
  const consoleOutput = contentContainer.querySelector(".console-output");
  const state = projectStates[project.id];
  state.consoleOutput.forEach((entry) => {
    consoleOutput.appendChild(entry.cloneNode(true));
  });
}

function renderServicesGrid(project) {
  const grid = document.querySelector(".services-status-grid");
  console.log(`[DEBUG] renderServicesGrid para: ${project.name}`);

  grid.innerHTML = "";

  // Ordenar servicios por orden
  const sortedServices = [...project.services].sort(
    (a, b) => a.order - b.order
  );

  sortedServices.forEach((service) => {
    const state = projectStates[project.id].services[service.id];
    console.log(
      `[DEBUG] Estado ${service.name}: running=${state.running}, ready=${state.ready}`
    );

    const card = document.createElement("div");
    card.className = "service-status-card";
    card.dataset.projectId = project.id;
    card.dataset.serviceId = service.id;

    // 🔥 Añadir la clase que determina el color del borde
    if (state.ready) {
      card.classList.add("running");
    } else if (state.running) {
      card.classList.add("starting");
    } else {
      card.classList.add("stopped");
    }

    card.style.position = "relative"; // Para que el menú sea absoluto

    card.innerHTML = `
      <div class="service-card-header" style="display:flex; justify-content:flex-end; position:relative;">
        <div class="service-menu-container">
          <button class="btn-icon btn-small service-menu-btn" title="Opciones">⋮</button>
          <div class="service-menu-options hidden">
            <button class="btn-icon btn-small edit-service-btn" title="Editar servicio">✏️</button>
            <button class="btn-icon btn-small delete-service-btn" title="Eliminar servicio">🗑️</button>
          </div>
        </div>
      </div>

      <div class="service-status-header">
        <span class="service-status-name">${service.name}</span>
        <span class="service-status-badge ${
          state.ready
            ? "status-running"
            : state.running
            ? "status-starting"
            : "status-stopped"
        }">
          ${
            state.ready
              ? "🟢 running"
              : state.running
              ? "🟡 starting…"
              : "🔴 detenido"
          }
        </span>
      </div>

      ${
        state.running && !state.ready
          ? `<div class="service-spinner"><div class="spinner"></div></div>`
          : `
            <div class="service-info">
              <span>Tipo: ${service.type}</span>
              <span>Puerto: ${service.port || "N/A"}</span>
              ${
                service.url
                  ? `<span>URL: <a href="${service.url}" target="_blank">${service.url}</a></span>`
                  : ""
              }
            </div>
            <div class="service-actions">
              <button class="btn btn-primary btn-small start-service-btn"
                      data-project-id="${project.id}" data-service-id="${
              service.id
            }"
                      ${state.running ? 'style="display:none"' : ""}>
                Iniciar
              </button>
              <button class="btn btn-danger btn-small stop-service-btn"
                      data-project-id="${project.id}" data-service-id="${
              service.id
            }"
                      ${!state.running ? 'style="display:none"' : ""}>
                Detener
              </button>
              ${
                service.url
                  ? `<button class="btn btn-secondary btn-small open-service-btn"
                      data-url="${service.url}" ${
                      !state.ready ? "disabled" : ""
                    }>Abrir</button>`
                  : ""
              }
            </div>
          `
      }
    `;

    // 👉 Botón de menú para mostrar/ocultar opciones
    const menuBtn = card.querySelector(".service-menu-btn");
    const menuOptions = card.querySelector(".service-menu-options");
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuOptions.classList.toggle("hidden");
    });

    // 👉 Botón para eliminar servicio
    card.querySelector(".delete-service-btn").addEventListener("click", () => {
      if (
        confirm(`¿Seguro que quieres eliminar el servicio "${service.name}"?`)
      ) {
        const index = project.services.findIndex((s) => s.id === service.id);
        if (index !== -1) {
          project.services.splice(index, 1);
          saveProjects().then(() => {
            renderServicesGrid(project);
            if (currentProject && currentProject.id === project.id) {
              selectProject(project);
            }
          });
        }
      }
    });

    // 👉 Botón para editar servicio
    card.querySelector(".edit-service-btn").addEventListener("click", () => {
      openServiceModal(project, service);
      menuOptions.classList.add("hidden");
    });

    grid.appendChild(card);
  });

  // 🚀 Añadir el Card “+” para crear un nuevo servicio
  const addCard = document.createElement("div");
  addCard.className = "service-status-card add-service-card";
  addCard.innerHTML = `
    <div class="service-status-card add-service-card">
      <div class="add-service-content centered">
        <h3 style="color: white; margin-bottom: 8px;">Añadir servicio</h3>
        <button class="btn btn-success btn-large add-service-btn">+</button>
      </div>
    </div>
  `;
  addCard
    .querySelector(".add-service-btn")
    .addEventListener("click", () => openServiceModal(project));
  grid.appendChild(addCard);

  // 👉 Botones de iniciar servicio
  grid.querySelectorAll(".start-service-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const projectId = btn.dataset.projectId;
      const serviceId = btn.dataset.serviceId;
      const project = projects.find((p) => p.id === projectId);
      const service = project.services.find((s) => s.id === serviceId);

      await window.api.startProjectService({
        projectId: project.id,
        serviceId: service.id,
        script: service.script,
        cwd: service.cwd,
      });
    });
  });

  // 👉 Botones de detener servicio
  grid.querySelectorAll(".stop-service-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const projectId = btn.dataset.projectId;
      const serviceId = btn.dataset.serviceId;
      window.toggleService(projectId, serviceId);
    });
  });

  // 👉 Botones de abrir URL del servicio
  grid.querySelectorAll(".open-service-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      window.open(url, "_blank");
    });
  });
}

window.openServiceModal = async function (project, service = null) {
  const modal = document.getElementById("serviceModal");
  const form = document.getElementById("serviceForm");

  form.reset();
  form.dataset.projectId = project.id;

  if (service) {
    document.getElementById("serviceId").value = service.id;
    document.getElementById("serviceName").value = service.name;
    document.getElementById("serviceType").value = service.type || "backend";
    document.getElementById("servicePort").value = service.port || "";
    document.getElementById("serviceOrder").value = service.order || 1;
    document.getElementById("serviceUrl").value = service.url || "";
    document.getElementById("serviceReadyKeywords").value =
      service.readyKeywords.join(", ");

    try {
      document.getElementById("serviceCwd").value = service.cwd || "";
      document.getElementById("serviceScript").value = service.script || "";
    } catch (error) {
      console.error("[ERROR] No se pudo establecer el script o la cwd:", error);
      document.getElementById("serviceCwd").value = "";
      document.getElementById("serviceScript").value = "";
    }
  } else {
    document.getElementById("serviceId").value = ""; // 🔥 limpia el ID para nuevo
  }

  modal.style.display = "block";
};

window.closeServiceModal = function () {
  const modal = document.getElementById("serviceModal");
  if (modal) modal.style.display = "none";
};

document.addEventListener("DOMContentLoaded", () => {
  const serviceForm = document.getElementById("serviceForm");
  if (serviceForm) {
    serviceForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const projectId = e.target.dataset.projectId;
      const project = projects.find((p) => p.id === projectId);
      if (!project) {
        console.error("[ERROR] Proyecto no encontrado para este servicio");
        return;
      }

      // Genera o conserva el ID
      const serviceIdInput = document.getElementById("serviceId");
      const serviceId = serviceIdInput?.value || generateId();

      const serviceData = {
        id: serviceId,
        name: document.getElementById("serviceName").value.trim(),
        type: document.getElementById("serviceType").value.trim() || "backend",
        cwd: document.getElementById("serviceCwd").value.trim() || null,
        script: document.getElementById("serviceScript").value.trim() || null,
        port: parseInt(document.getElementById("servicePort").value) || null,
        order: parseInt(document.getElementById("serviceOrder").value) || 1,
        url: document.getElementById("serviceUrl").value.trim() || null,
        readyKeywords: document
          .getElementById("serviceReadyKeywords")
          .value.split(",")
          .map((k) => k.trim())
          .filter((k) => k),
      };

      // 💡 ¡Ya no creamos script .bat!
      // Directamente guardamos el comando real (`script`) que introdujo el usuario

      // Buscar si ya existe el servicio y reemplazarlo
      const existingIndex = project.services.findIndex(
        (s) => s.id === serviceData.id
      );
      if (existingIndex !== -1) {
        project.services[existingIndex] = serviceData;
      } else {
        project.services.push(serviceData);
      }

      // Inicializar estado si es nuevo
      if (!projectStates[project.id]) {
        projectStates[project.id] = { services: {} };
      }
      if (!projectStates[project.id].services[serviceData.id]) {
        projectStates[project.id].services[serviceData.id] = {
          ready: false,
          running: false,
          process: null,
        };
      }

      await saveProjects();
      renderServicesGrid(project);
      closeServiceModal();
      console.log("[TRACE] Servicio guardado y modal cerrado");

      if (currentProject && currentProject.id === project.id) {
        selectProject(project);
      }
    });
  } else {
    console.warn("[WARN] No se encontró el formulario serviceForm");
  }
});

// Configurar filtro de consola
function setupConsoleFilter(project) {
  const filter = document.querySelector(".console-filter");
  filter.innerHTML = '<option value="all">Todos los servicios</option>';

  project.services.forEach((service) => {
    const option = document.createElement("option");
    option.value = service.id;
    option.textContent = service.name;
    filter.appendChild(option);
  });

  filter.addEventListener("change", (e) => {
    filterConsole(e.target.value);
  });
}

// Filtrar consola
function filterConsole(serviceId) {
  const entries = document.querySelectorAll(".console-entry");
  entries.forEach((entry) => {
    if (serviceId === "all" || entry.dataset.serviceId === serviceId) {
      entry.style.display = "block";
    } else {
      entry.style.display = "none";
    }
  });
}

// Configurar controles del proyecto
function setupProjectControls(project) {
  const startAllBtn = document.querySelector(".start-all-btn");
  const stopAllBtn = document.querySelector(".stop-all-btn");
  const clearBtn = document.querySelector(".clear-console");
  const editBtn = document.querySelector(".edit-btn");

  startAllBtn.addEventListener("click", () => startAllServices(project));
  stopAllBtn.addEventListener("click", () => stopAllServices(project));
  clearBtn.addEventListener("click", () => clearProjectConsole(project));
  editBtn.addEventListener("click", () => openProjectModal(project));
}

window.toggleService = async function (projectId, serviceId) {
  console.log(`[TRACE] toggleService llamado para:`, projectId, serviceId); // 💡 Añadido

  const project = projects.find((p) => p.id === projectId);
  const service = project.services.find((s) => s.id === serviceId);
  const state = projectStates[projectId].services[serviceId];

  if (state.running) {
    console.log(`[TRACE] Deteniendo ${service.name}`); // 💡 Añadido
    await stopService(project, service);
  } else {
    console.log(`[TRACE] Iniciando ${service.name}`); // 💡 Añadido
    await startService(project, service);
  }
};

// Iniciar servicio individual
async function startService(project, service) {
  const state = projectStates[project.id].services[service.id];
  addProjectConsoleMessage(
    project,
    `Iniciando ${service.name}...`,
    "info",
    "system",
    service.id
  );
  console.log("[DEBUG startService] Enviando a main.js:", {
    projectId: project.id,
    serviceId: service.id,
    script: service.script,
    cwd: service.cwd,
  });

  try {
    if (service.port) {
      await window.api.checkAndFreeSpecificPorts([service.port]);
    }

    state.running = true;
    await window.api.startProjectService({
      projectId: project.id,
      serviceId: service.id,
      script: service.script,
      cwd: service.cwd,
    });

    updateProjectUI(project);

    // Timeout de 30 segundos para detectar si no está listo
    const timeout = setTimeout(() => {
      if (!state.ready) {
        addProjectConsoleMessage(
          project,
          `⚠️ ${service.name} no respondió en 60s. Puede haber fallado o tardar más.`,
          "warning",
          "system",
          service.id
        );
      }
    }, 60000);

    // Limpiar timeout si el servicio se marca como listo
    const observer = new MutationObserver(() => {
      if (state.ready) clearTimeout(timeout);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (error) {
    state.running = false;
    addProjectConsoleMessage(
      project,
      `Error al iniciar ${service.name}: ${error.message}`,
      "error",
      "system",
      service.id
    );
  }
}

async function stopService(project, service) {
  try {
    await window.api.stopProjectService({
      projectId: project.id,
      serviceId: service.id,
    });
    addProjectConsoleMessage(
      project,
      `${service.name} detenido`,
      "info",
      "system",
      service.id
    );
  } catch (error) {
    addProjectConsoleMessage(
      project,
      `Error al detener ${service.name}: ${error.message}`,
      "error",
      "system",
      service.id
    );
  }
}

async function startAllServices(project) {
  addProjectConsoleMessage(
    project,
    "▶️ Iniciando todos los servicios...",
    "info",
    "system"
  );

  // Guardar fecha de arranque
  project.lastStartedAt = new Date().toISOString();

  // Persistir
  await saveProjects();

  // Obtener puertos
  const ports = project.services.filter((s) => s.port).map((s) => s.port);
  if (ports.length > 0) {
    await window.api.checkAndFreeSpecificPorts(ports);
  }

  const sortedServices = [...project.services].sort(
    (a, b) => a.order - b.order
  );
  for (const service of sortedServices) {
    await startService(project, service);
    if (service !== sortedServices[sortedServices.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  updateProjectUI(project);
}

async function stopAllServices(project) {
  addProjectConsoleMessage(
    project,
    "⏹️ Deteniendo todos los servicios...",
    "info",
    "system"
  );
  for (const service of project.services) {
    await stopService(project, service);
  }

}

// Funciones del modal
window.openProjectModal = function (project = null) {
  const modal = document.getElementById("projectModal");
  const modalTitle = document.getElementById("modalTitle");
  const deleteBtn = document.getElementById("deleteBtn");

  if (project) {
    modalTitle.textContent = "Editar Proyecto";
    editingProjectId = project.id;
    deleteBtn.style.display = "block";

    // Rellenar el formulario
    document.getElementById("projectName").value = project.name;
    document.getElementById("projectDescription").value =
      project.description || "";
    document.getElementById("projectIcon").value = project.icon;
  } else {
    modalTitle.textContent = "Nuevo Proyecto";
    editingProjectId = null;
    deleteBtn.style.display = "none";
    document.getElementById("projectForm").reset();
  }

  modal.style.display = "block";
};

window.closeProjectModal = function () {
  document.getElementById("projectModal").style.display = "none";
  editingProjectId = null;
};

// Añadir servicio al modal
window.addService = function () {
  addServiceToModal();
};

function addServiceToModal(serviceData = null) {
  const template = document.getElementById("serviceTemplate");
  const clone = template.content.cloneNode(true);
  const serviceItem = clone.querySelector(".service-item");

  serviceItem.dataset.serviceIndex = serviceCounter++;

  if (serviceData) {
    clone.querySelector(".service-name").value = serviceData.name;
    clone.querySelector(".service-type").value = serviceData.type || "backend";
    clone.querySelector(".service-port").value = serviceData.port || "";
    clone.querySelector(".service-order").value = serviceData.order || 1;
    clone.querySelector(".service-url").value = serviceData.url || "";
    clone.querySelector(".service-keywords").value =
      serviceData.readyKeywords.join(", ");

    // Cargar script
    loadServiceScript(serviceData, clone);
  }

  document.getElementById("servicesList").appendChild(clone);
}

async function loadServiceScript(serviceData, element) {
  try {
    const content = await window.api.readFile(serviceData.script);
    element.querySelector(".service-script").value =
      content || `Archivo: ${serviceData.script}`;
  } catch (error) {
    element.querySelector(".service-script").value = serviceData.script;
  }
}

window.removeService = function (button) {
  button.closest(".service-item").remove();
};

document.getElementById("projectForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const projectData = {
    id: editingProjectId || generateId(),
    name: document.getElementById("projectName").value.trim(),
    description: document.getElementById("projectDescription").value.trim(),
    icon: document.getElementById("projectIcon").value.trim() || "",
    services: [], // ¡Vacío al crearlo!
  };

  if (editingProjectId) {
    const index = projects.findIndex((p) => p.id === editingProjectId);
    if (index !== -1) {
      projects[index] = projectData;
    }
  } else {
    projects.push(projectData);
  }

  await saveProjects();
  renderProjectsList();
  closeProjectModal();

  if (currentProject && currentProject.id === projectData.id) {
    selectProject(projectData);
  }
});

// Eliminar proyecto
document.getElementById("deleteBtn").addEventListener("click", async () => {
  if (
    editingProjectId &&
    confirm("¿Estás seguro de que quieres eliminar este proyecto?")
  ) {
    // Detener todos los servicios primero
    const project = projects.find((p) => p.id === editingProjectId);
    if (project && projectStates[project.id]) {
      await stopAllServices(project);
    }

    projects = projects.filter((p) => p.id !== editingProjectId);
    delete projectStates[editingProjectId];

    await saveProjects();

    if (currentProject && currentProject.id === editingProjectId) {
      currentProject = null;
      document.getElementById("projectContent").innerHTML = `
        <div class="welcome-message">
          <h2>Bienvenido</h2>
          <p>Selecciona un proyecto de la lista para comenzar</p>
        </div>
      `;
    }

    renderProjectsList();
    closeProjectModal();
  }
});

// Funciones de consola
function addProjectConsoleMessage(
  project,
  message,
  type = "info",
  process = "",
  serviceId = null
) {
  if (currentProject && currentProject.id === project.id) {
    addConsoleMessage(message, type, process, serviceId);
  }

  // Guardar en el estado
  const entry = createConsoleEntry(message, type, process, serviceId);
  projectStates[project.id].consoleOutput.push(entry);

  // Limitar el tamaño del historial
  if (projectStates[project.id].consoleOutput.length > 1000) {
    projectStates[project.id].consoleOutput.shift();
  }
}

function createConsoleEntry(message, type, process, serviceId) {
  const entry = document.createElement("div");
  entry.className = `console-entry ${type}`;
  entry.dataset.serviceId = serviceId || "system";

  const timestamp = new Date().toLocaleTimeString();
  const processTag = process ? `[${process.toUpperCase()}]` : "";

  entry.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <strong class="process-tag">${processTag}</strong>
    <span class="message">${message}</span>
  `;

  return entry;
}

function addConsoleMessage(
  message,
  type = "info",
  process = "",
  serviceId = null
) {
  const consoleOutput = document.querySelector(".console-output");
  if (!consoleOutput) return;

  const entry = createConsoleEntry(message, type, process, serviceId);
  consoleOutput.appendChild(entry);

  if (autoScrollEnabled) {
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
}

function clearProjectConsole(project) {
  const consoleOutput = document.querySelector(".console-output");
  if (consoleOutput) {
    consoleOutput.innerHTML = "";
  }
  projectStates[project.id].consoleOutput = [];
}

function updateProjectUI(project) {
  console.log(`[DEBUG] updateProjectUI llamado para: ${project.name}`);

  // SIEMPRE renderiza la grid actualizada
  renderServicesGrid(project);

  // Actualiza el estado en la lista global
  updateProjectListStatus(project);
  // Llama a la función que actualiza los botones
  updateProjectButtons(project);
}

function updateProjectButtons(project) {
  const projectDetail = document.querySelector(".project-detail");
  if (!projectDetail) return;

  const startAllBtn = projectDetail.querySelector(".start-all-btn");
  const stopAllBtn = projectDetail.querySelector(".stop-all-btn");

  const runningServices = project.services.filter(
    (s) => projectStates[project.id].services[s.id].running
  );

  if (runningServices.length > 0) {
    startAllBtn.disabled = true;
    stopAllBtn.disabled = false;
  } else {
    startAllBtn.disabled = false;
    stopAllBtn.disabled = true;
  }
}

function updateProjectListStatus(project) {
  const statusElement = document.getElementById(`status-${project.id}`);
  const projectItem = statusElement.closest(".project-item");

  if (statusElement && projectItem) {
    const runningServices = project.services.filter(
      (s) => projectStates[project.id]?.services[s.id]?.running
    ).length;
    const totalServices = project.services.length;

    // Estado global
    let globalStatusClass = "status-stopped";
    let globalStatusIcon = "🔴";
    if (runningServices === totalServices && totalServices > 0) {
      globalStatusClass = "status-running";
      globalStatusIcon = "🟢";
    } else if (runningServices > 0) {
      globalStatusClass = "status-partial";
      globalStatusIcon = "🟡";
    }

    // Actualizar texto de estado
    statusElement.innerHTML = `
      <span class="status-dot ${
        runningServices > 0 ? "running" : "stopped"
      }"></span> 
      ${runningServices}/${totalServices} servicios activos
    `;

    // Actualizar icono global
    const globalIcon = projectItem.querySelector(".global-status-icon");
    globalIcon.textContent = globalStatusIcon;
    globalIcon.className = `global-status-icon ${globalStatusClass}`;
  }
}

// Escuchar eventos del proceso principal
window.api.onProcessOutput((data) => {
  console.log("[DEBUG] Llegó salida:", data);

  const project = projects.find((p) => p.id === data.projectId);

  if (project) {
    const service = project.services.find((s) => s.id === data.process);
    if (!service) return;

    const output = data.data.trim();

    // Detecta si es el backend o un servicio que sabemos que lanza "BUILD FAILED" cuando lo matamos
    if (output.includes("BUILD FAILED") && service.type === "backend") {
      addProjectConsoleMessage(
        project,
        "✅ Servicio detenido correctamente",
        "success",
        "system",
        service.id
      );
    } else if (output.toLowerCase().includes("error") || data.type === "stderr") {
      addProjectConsoleMessage(project, output, "error", "system", service.id);
    } else {
      addProjectConsoleMessage(project, output, "info", service.name, service.id);
    }

    checkServiceReady(project, service, data);
  } else {
    // 🔥 Si no hay project, lo pintamos en la consola global directamente
    const consoleOutput = document.querySelector(".console-output");
    const entry = document.createElement("div");
    entry.classList.add("console-entry", data.type === "stderr" ? "error" : "info");
    entry.textContent = data.data;
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
});


window.api.onProcessClosed((data) => {
  const project = projects.find((p) => p.id === data.projectId);
  if (!project) return;
  const service = project.services.find((s) => s.id === data.process);
  if (!service) return;
  const state = projectStates[project.id].services[service.id];
  state.running = false;
  state.ready = false;
  addProjectConsoleMessage(
    project,
    `Proceso terminado con código: ${data.code}`,
    "warning",
    service.name,
    service.id
  );
  updateProjectUI(project);
});

function checkServiceReady(project, service, data) {
  const state = projectStates[project.id].services[service.id];
  const output = data.data.toLowerCase();
  console.log(`[TRACE] Salida para ${service.name}:`, data.data);
  const ready = service.readyKeywords.some((keyword) =>
    output.includes(keyword.toLowerCase())
  );

  if (ready && !state.ready) {
    console.log(
      `[DEBUG] Servicio ${service.name} marcado como listo por:`,
      service.readyKeywords.filter((keyword) =>
        output.includes(keyword.toLowerCase())
      )
    );
    state.ready = true;
    addProjectConsoleMessage(
      project,
      `✓ ${service.name} está listo`,
      "success",
      "system",
      service.id
    );
    currentProject = project;
    updateProjectUI(project);

    // Verificar si todos los servicios están listos
    const allReady = project.services.every(
      (s) =>
        projectStates[project.id].services[s.id].ready ||
        !projectStates[project.id].services[s.id].running
    );

    if (allReady) {
      addProjectConsoleMessage(
        project,
        "✓ Todos los servicios están listos",
        "success",
        "system"
      );
    }
  }
}

// Event listener para añadir proyecto
document
  .getElementById("addProjectBtn")
  .addEventListener("click", () => openProjectModal());

function exportConsoleLogs() {
  const logs = [];
  document.querySelectorAll(".console-entry").forEach((entry) => {
    logs.push(entry.textContent.trim());
  });

  const content = logs.join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `logs_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
  a.click();

  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeServiceModalBtn");
  const cancelBtn = document.getElementById("cancelServiceModalBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeServiceModal();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      closeServiceModal();
    });
  }
});

window.api.onProcessStarting((event, { projectId, process }) => {
  const project = projects.find((p) => p.id === projectId);
  if (
    project &&
    projectStates[projectId] &&
    projectStates[projectId].services[process]
  ) {
    const state = projectStates[projectId].services[process];
    state.running = true;

    // 🔥 Busca el card correspondiente en el DOM y actualiza la clase
    const card = document.querySelector(
      `.service-status-card[data-project-id="${projectId}"][data-service-id="${process}"]`
    );
    if (card) {
      card.classList.remove("stopped", "running");
      card.classList.add("starting");
    }

    updateProjectUI(project); // Mantiene la lógica que ya tenías
  }
});


window.api.onProcessReady((event, { projectId, process }) => {
  const project = projects.find((p) => p.id === projectId);
  if (
    project &&
    projectStates[projectId] &&
    projectStates[projectId].services[process]
  ) {
    const state = projectStates[projectId].services[process];
    state.ready = true;

    // 🔥 Busca el card correspondiente en el DOM y actualiza la clase
    const card = document.querySelector(
      `.service-status-card[data-project-id="${projectId}"][data-service-id="${process}"]`
    );
    if (card) {
      card.classList.remove("stopped", "starting");
      card.classList.add("running");
    }

    updateProjectUI(project);
  }
});
