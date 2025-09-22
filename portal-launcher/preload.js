const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // APIs para múltiples proyectos y servicios
startProjectService: (params) => ipcRenderer.invoke('start-project-service', params),
  // Detiene el servicio
  stopProjectService: (params) => ipcRenderer.invoke('stop-project-service', params),

  // Recibe salida de logs
  onProcessOutput: (callback) => ipcRenderer.on('process-output', callback),

  // 🟠 Nuevo: Recibe evento cuando el proceso está "arrancando"
  onProcessStarting: (callback) => ipcRenderer.on('process-starting', callback),

  // 🟢 Nuevo: Recibe evento cuando el proceso está "listo"
  onProcessReady: (callback) => ipcRenderer.on('process-ready', callback),
  stopProjectServices: (projectId) => 
    ipcRenderer.invoke('stop-project-services', projectId),
  checkAndFreeSpecificPorts: (ports) => 
    ipcRenderer.invoke('check-and-free-specific-ports', ports),
  
  // APIs para configuración
  loadProjects: () => ipcRenderer.invoke('load-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),
  createBatFile: (filename, content) => ipcRenderer.invoke('create-bat-file', filename, content),
  readFile: (filepath) => ipcRenderer.invoke('read-file', filepath),
  
  // APIs legacy (compatibilidad)
  startBackend: () => ipcRenderer.invoke('start-backend'),
  startFrontend: () => ipcRenderer.invoke('start-frontend'),
  stopServices: () => ipcRenderer.invoke('stop-services'),
  checkAndFreePorts: () => ipcRenderer.invoke('check-and-free-ports'),
  stopPort: (port) => ipcRenderer.invoke("stop-port", port),
 checkPortsInUse: (ports) => {
  console.log("[TRACE preload.js] checkPortsInUse llamado con:", ports);
  return ipcRenderer.invoke("check-ports-in-use", ports);
}
,


  // Eventos
  onProcessOutput: (callback) => {
    ipcRenderer.on('process-output', (event, data) => callback(data));
  },
  onProcessClosed: (callback) => {
    ipcRenderer.on('process-closed', (event, data) => callback(data));
  }
  
});