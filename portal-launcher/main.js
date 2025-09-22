const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn, exec } = require("child_process");
const net = require("net");
const fs = require("fs").promises;


// Validadores
function isPathSafe(filepath) {
  const absolutePath = path.resolve(filepath);
  const projectRoot = path.resolve(__dirname);
  return absolutePath.startsWith(projectRoot);
}

function isValidString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isCwdSafe(cwdPath) {
  const absolutePath = path.resolve(cwdPath);
  const projectRoot = path.resolve(__dirname); // o donde estén tus proyectos
  return absolutePath.startsWith(projectRoot);
}

let mainWindow;
let projectProcesses = {};
let processes = {};

// Verificar puerto
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

function killPortPowerShell(port) {
  return new Promise((resolve) => {
    const psCommand = `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`;
    exec(`powershell -Command "${psCommand}"`, () => setTimeout(resolve, 1500));
  });
}

// Liberar puerto
async function killPort(port) {
  await killPortPowerShell(port);
  exec(`netstat -ano | findstr :${port}`, (err, stdout) => {
    if (err || !stdout) return;
    const lines = stdout.trim().split("\n");
    const pids = new Set();
    lines.forEach((line) => {
      if (line.includes("LISTENING")) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0") pids.add(pid);
      }
    });
    Array.from(pids).forEach((pid) => {
      exec(`taskkill /PID ${pid} /T /F`);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: true,
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile("index.html");
}

function runProcess(command, processName, projectId, cwd) {
  console.log("[DEBUG runProcess] Lanzando:", command, "en:", cwd);

  return new Promise((resolve, reject) => {
    // 💡 Separa el comando en cmd + args (por ejemplo: ['mvn', ['spring-boot:run']])
    const [cmd, ...args] = command.split(" ");

    const proc = spawn(cmd, args, {
      cwd,
      shell: true,
      env: process.env, // ⚡️ Hereda todas tus variables de entorno (PATH, MAVEN_HOME, etc.)
    });

    if (!projectProcesses[projectId]) projectProcesses[projectId] = {};
    projectProcesses[projectId][processName] = proc;

    proc.stdout.on("data", (data) => {
      const output = data.toString();

      // 🟠 Activa spinner si detecta una línea de gradle task
      if (
        // para proyectos Spring Boot
        output.includes("> Task :") ||
        // para proyectos Flutter
        output.includes("Waiting for connection from debug service") ||
        output.includes("Launching lib\\main.dart on Edge in debug mode")
      ) {
        console.log(
          "[TRACE runProcess] Activando spinner para:",
          output.trim()
        );
        mainWindow.webContents.send("process-starting", {
          projectId,
          process: processName,
        });
      }

      // 🟢 Marca como ready cuando detecta "Started"
      if (output.includes("Started")) {
        mainWindow.webContents.send("process-ready", {
          projectId,
          process: processName,
        });
      }

      // 🔧 Manda siempre los logs completos
      mainWindow.webContents.send("process-output", {
        projectId,
        process: processName,
        data: output,
        type: "stdout",
      });
    });

    proc.stderr.on("data", (data) => {
      mainWindow.webContents.send("process-output", {
        projectId,
        process: processName,
        data: data.toString(),
        type: "stderr",
      });
    });

    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      mainWindow.webContents.send("process-closed", {
        projectId,
        process: processName,
        code,
      });
      delete projectProcesses[projectId][processName];
    });

    setTimeout(() => resolve({ started: true }), 1000);
  });
}

ipcMain.handle(
  "start-project-service",
  async (event, { projectId, serviceId, script, cwd }) => {
    if (
      !isValidString(projectId) ||
      !isValidString(serviceId) ||
      !isValidString(script) ||
      !isValidString(cwd)
    ) {
      throw new Error("Argumentos inválidos");
    }

    // 🚀 ¡Ya no validamos cwd contra __dirname!
    return runProcess(script, serviceId, projectId, cwd);
  }
);

ipcMain.handle(
  "stop-project-service",
  async (event, { projectId, serviceId }) => {
    console.log(`[TRACE main.js] stop-project-service recibido:`, {
      projectId,
      serviceId,
    });

    try {
      if (
        projectProcesses[projectId] &&
        projectProcesses[projectId][serviceId]
      ) {
        const proc = projectProcesses[projectId][serviceId];
        console.log(`[TRACE] Matando proceso ${serviceId} con PID ${proc.pid}`);

        // Usa taskkill con /T para matar también procesos hijos
        exec(`taskkill /PID ${proc.pid} /T /F`, (error, stdout, stderr) => {
          if (error) {
            console.error(
              `[ERROR main.js] Error al forzar taskkill de PID ${proc.pid}:`,
              error.message
            );
          } else {
            console.log(
              `[TRACE main.js] Proceso con PID ${proc.pid} forzado con taskkill`
            );
            console.log(`[TRACE main.js] STDOUT:`, stdout.trim());
            console.log(`[TRACE main.js] STDERR:`, stderr.trim());
          }
        });

        delete projectProcesses[projectId][serviceId];
        return { success: true };
      } else {
        console.warn(
          `[WARN main.js] No se encontró proceso activo para ${serviceId} en ${projectId}`
        );
        return { success: false, error: "No running process found" };
      }
    } catch (error) {
      console.error(
        `[ERROR main.js] Error al detener servicio:`,
        error.message
      );
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle("stop-project-services", async (event, projectId) => {
  if (!isValidString(projectId)) throw new Error("Argumento inválido");

  if (projectProcesses[projectId]) {
    for (const [service, process] of Object.entries(
      projectProcesses[projectId]
    )) {
      if (process) {
        console.log(
          `[TRACE main.js] Intentando detener proceso ${service} con PID ${process.pid}`
        );
        process.kill("SIGTERM");

        setTimeout(() => {
          exec(`taskkill /pid ${process.pid} /T /F`, (error) => {
            if (error) {
              console.error(`Error al forzar taskkill de ${service}:`, error);
            } else {
              console.log(
                `[TRACE main.js] Proceso ${service} forzado con taskkill`
              );
            }
          });
        }, 3000);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
    delete projectProcesses[projectId];
  }

  return { success: true };
});

ipcMain.handle("check-and-free-specific-ports", async (event, ports) => {
  for (const port of ports) {
    await killPort(port);
    const inUse = await checkPort(port);
    if (inUse) await killPortPowerShell(port);
    mainWindow.webContents.send("process-output", {
      projectId: "system",
      process: "system",
      data: `✓ Puerto ${port} liberado`,
      type: "success",
    });
  }
  return { success: true };
});

ipcMain.handle("read-file", async (event, filepath) => {
  if (!isValidString(filepath)) throw new Error("Archivo no válido");
  const fullPath = path.join(__dirname, filepath);
  if (!isPathSafe(fullPath))
    throw new Error("Intento de leer archivo fuera del proyecto");
  return fs.readFile(fullPath, "utf8");
});

ipcMain.handle("load-projects", async () => {
  try {
    const configPath = path.join(__dirname, "projects.json");
    const data = await fs.readFile(configPath, "utf8");
    return JSON.parse(data).projects || [];
  } catch (error) {
    console.error(`[ERROR main.js] No se pudo cargar projects.json:`, error);
    return [];
  }
});

ipcMain.handle("save-projects", async (event, projects) => {
  const configPath = path.join(__dirname, "projects.json");
  await fs.writeFile(configPath, JSON.stringify({ projects }, null, 2), "utf8");
  return { success: true };
});

ipcMain.handle("start-backend", async () =>
  runProcess("scripts\\start_backend.bat", "backend", "portal-ia")
);
ipcMain.handle("start-frontend", async () =>
  runProcess("scripts\\start_frontend.bat", "frontend", "portal-ia")
);
ipcMain.handle("stop-services", async () =>
  ipcMain.handle("stop-project-services", null, "portal-ia")
);
ipcMain.handle("check-and-free-ports", async () =>
  ipcMain.handle("check-and-free-specific-ports", null, [8081, 3000])
);

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function startQuestionBuilder() {
  if (processes.builder) {
    console.log("⚠️ Question Builder ya está corriendo");
    return;
  }

  processes.builder = spawn("npm", ["run", "serve"], {
    cwd: "C:/Users/vmhuecas/question/question-builder",
    shell: true,
  });

  processes.builder.stdout.on("data", (data) => {
    console.log(`[builder] ${data}`);
  });

  processes.builder.stderr.on("data", (data) => {
    console.error(`[builder-error] ${data}`);
  });

  processes.builder.on("close", (code) => {
    console.log(`🛑 Question Builder terminó con código ${code}`);
    processes.builder = null;
  });

  console.log("✅ Question Builder lanzado");
}

function stopQuestionBuilder() {
  if (processes.builder) {
    console.log("🛑 Deteniendo Question Builder...");
    processes.builder.kill();
    processes.builder = null;
  } else {
    console.log("❌ Question Builder no está corriendo");
  }
}

// 🔥 Funciones para otro tipo especial (Answer)
function startAnswer() {
  if (processes.answer) {
    console.log("⚠️ Answer ya está corriendo");
    return;
  }

  processes.answer = spawn("npm", ["run", "start"], {
    cwd: "C:/Users/vmhuecas/question/question-answer",
    shell: true,
  });

  processes.answer.stdout.on("data", (data) => {
    console.log(`[answer] ${data}`);
  });

  processes.answer.stderr.on("data", (data) => {
    console.error(`[answer-error] ${data}`);
  });

  processes.answer.on("close", (code) => {
    console.log(`🛑 Answer terminó con código ${code}`);
    processes.answer = null;
  });

  console.log("✅ Answer lanzado");
}

function stopAnswer() {
  if (processes.answer) {
    console.log("🛑 Deteniendo Answer...");
    processes.answer.kill();
    processes.answer = null;
  } else {
    console.log("❌ Answer no está corriendo");
  }
}

// 🚀 Escuchar eventos desde renderer.js
ipcMain.on("start-question-builder", () => {
  startQuestionBuilder();
});

ipcMain.on("stop-question-builder", () => {
  stopQuestionBuilder();
});

ipcMain.on("start-answer", () => {
  startAnswer();
});

ipcMain.on("stop-answer", () => {
  stopAnswer();
});

// 🛑 Cierra todos los procesos cuando se cierra la app
app.on("window-all-closed", () => {
  for (let key in processes) {
    if (processes[key]) {
      processes[key].kill();
    }
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("stop-port", async (event, port) => {
  const sendOutput = (data, type = "stdout") => {
    mainWindow.webContents.send("process-output", {
      projectId: "port-detector",
      process: `puerto-${port}`,
      data,
      type
    });
  };

  const message = `[TRACE] Intentando detener proceso en el puerto ${port}`;
  console.log(message);
  sendOutput(message);

  return new Promise((resolve, reject) => {
    exec(`netstat -ano | findstr :${port}`, (err, stdout, stderr) => {
      if (err || !stdout) {
        const errorMsg = `[ERROR] No se encontró proceso en el puerto ${port}`;
        console.error(errorMsg);
        sendOutput(errorMsg, "stderr");
        return resolve({ success: false, message: "No se encontró proceso en ese puerto" });
      }

      const lines = stdout.trim().split("\n");
      const pid = lines[0].trim().split(/\s+/).pop();
      const foundMsg = `[TRACE] PID para puerto ${port}: ${pid}`;
      console.log(foundMsg);
      sendOutput(foundMsg);

      exec(`taskkill /PID ${pid} /T /F`, (err) => {
        if (err) {
          const errorMsg = `[ERROR] No se pudo detener el proceso PID ${pid}`;
          console.error(errorMsg);
          sendOutput(errorMsg, "stderr");
          return resolve({ success: false, message: "Error al detener el proceso" });
        }

        const stoppedMsg = `[INFO] Proceso en puerto ${port} detenido.`;
        console.log(stoppedMsg);
        sendOutput(stoppedMsg);
        resolve({ success: true, message: "Proceso detenido correctamente" });
      });
    });
  });
});


const isPortInUse = (port) => {
  return new Promise((resolve) => {
    console.log(`[TRACE isPortInUse] Comprobando puerto: ${port}`);
    exec(`netstat -ano | findstr :${port}`, (err, stdout, stderr) => {
      console.log(`[TRACE isPortInUse] Error: ${err ? err.message : "ninguno"}`);
      console.log(`[TRACE isPortInUse] STDOUT: "${stdout.trim()}"`);
      console.log(`[TRACE isPortInUse] STDERR: "${stderr ? stderr.trim() : "ninguno"}"`);

      if (err || !stdout.trim()) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};


ipcMain.handle("check-ports-in-use", async (event, ports) => {
  const results = {};
  for (const port of ports) {
    results[port] = await isPortInUse(port);
  }
  return results;
});



