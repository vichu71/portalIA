$basePath = "D:\portalIA\portal-launcher"
New-Item -ItemType Directory -Force -Path "$basePath\scripts" | Out-Null

# Archivos principales
Set-Content -Path "$basePath\package.json" -Value @'
{
  "name": "portal-launcher",
  "version": "1.0.0",
  "description": "App de escritorio para lanzar PortalIA",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "author": "Víctor",
  "license": "ISC",
  "devDependencies": {
    "electron": "^29.0.0"
  }
}
'@

Set-Content -Path "$basePath\main.js" -Value @'
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 350,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
'@

Set-Content -Path "$basePath\preload.js" -Value @'
const { contextBridge } = require("electron");
const { exec } = require("child_process");

contextBridge.exposeInMainWorld("api", {
  startBackend: (callback) => {
    exec("cmd /c scripts\\start_backend.bat", (err, stdout, stderr) => {
      console.log("BACKEND:", stdout, stderr);
      if (callback) callback();
    });
  },
  startFrontend: (callback) => {
    exec("cmd /c scripts\\start_frontend.bat", (err, stdout, stderr) => {
      console.log("FRONTEND:", stdout, stderr);
      if (callback) callback();
    });
  }
});
'@

Set-Content -Path "$basePath\index.html" -Value @'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>PortalIA Launcher</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>🚀 PortalIA Launcher</h1>
    <button onclick="iniciarServicios()">Iniciar servicios</button>
    <p id="status">Esperando acción...</p>
  </div>

  <script>
    function log(msg) {
      document.getElementById("status").innerText = msg;
    }

    function iniciarServicios() {
      log("🕒 Iniciando Backend...");
      window.api.startBackend(() => {
        log("✅ Backend lanzado. Iniciando Frontend...");
        window.api.startFrontend(() => {
          log("✅ Frontend lanzado correctamente.");
        });
      });
    }

    console.log("API:", window.api);
  </script>
</body>
</html>
'@

Set-Content -Path "$basePath\styles.css" -Value @'
body {
  font-family: "Segoe UI", sans-serif;
  background-color: #1e1e2f;
  color: white;
  margin: 0;
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
h1 {
  color: #fbbf24;
  margin-bottom: 30px;
}
button {
  padding: 12px 30px;
  font-size: 16px;
  background-color: #22c55e;
  border: none;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: 0.2s ease;
}
button:hover {
  background-color: #16a34a;
}
'@

# Scripts .bat
Set-Content -Path "$basePath\scripts\start_backend.bat" -Value @'
@echo off
cd /d D:\portalIA\model-evaluator-api
mvn spring-boot:run
'@

Set-Content -Path "$basePath\scripts\start_frontend.bat" -Value @'
@echo off
cd /d D:\portalIA\dashboard-eval-ia
npm start
'@

Write-Host "✅ Proyecto PortalIA Launcher generado en: $basePath"
Write-Host "👉 Ahora ejecuta: cd $basePath && npm install && npm start"
