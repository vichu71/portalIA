
Dev Projects Launcher
======================

Dev Projects Launcher es una aplicación de escritorio basada en Electron que permite gestionar y lanzar proyectos de desarrollo desde una única interfaz unificada. Ideal para desarrolladores que trabajan con múltiples microservicios o proyectos con varios componentes (backend, frontend, etc.).

Características principales
---------------------------

- Lista de proyectos: visualiza todos tus proyectos con nombre, descripción e icono personalizado.
- Servicios por proyecto: cada proyecto puede tener múltiples servicios asociados (backend, frontend, base de datos, builder, answer, etc.).
- Arranque y parada de servicios:
  - Inicia o detiene servicios individualmente.
  - Inicia o detiene todos los servicios de un proyecto de forma simultánea.
- Detección automática de puertos ocupados:
  - Comprueba el estado real de cada servicio.
  - Muestra si un puerto está en uso antes de iniciar el servicio.
- Consola integrada: cada proyecto tiene su propia consola con logs en tiempo real (stdout y stderr).
- Detener procesos por puerto: herramienta para forzar el cierre de procesos que ocupen un puerto específico.
- Edición fácil: puedes añadir, editar o eliminar proyectos y servicios desde la interfaz.

Tecnologías utilizadas
-----------------------

- Electron: plataforma base para crear la app de escritorio.
- Node.js (child_process, netstat, taskkill): control y gestión de procesos del sistema operativo.
- HTML, CSS y JavaScript: para la interfaz de usuario y lógica principal.
- projects.json: archivo de configuración donde se almacenan todos los proyectos y sus servicios.

Estructura de archivos principales
-----------------------------------

/ (raíz)
├── index.html         # Interfaz principal
├── renderer.js        # Lógica de la interfaz (renderer)
├── preload.js         # API puente entre renderer y main
├── main.js            # Proceso principal de Electron
├── projects.json      # Archivo de configuración de proyectos
├── styles.css         # Estilos de la app
└── README.txt         # Este archivo

Cómo usar
---------

1. Clona el proyecto:
   git clone https://github.com/tu-usuario/dev-projects-launcher.git
   cd dev-projects-launcher

2. Instala las dependencias:
   npm install

3. Inicia la app:
   npm start

4. Personaliza tus proyectos:
   - Edita projects.json directamente.
   - O usa la interfaz para añadir y editar desde la app.

Cómo se crean los proyectos y servicios
---------------------------------------

Puedes crear y editar los proyectos y servicios desde la interfaz de la app o editando manualmente el archivo projects.json.
Aquí te explico cómo funciona cada campo:

Estructura de un proyecto en projects.json
------------------------------------------

{
  "id": "question",
  "name": "Question",
  "description": "Aplicacion de generación de encuestas. Compuesto de 4 modulos para su funcionamiento",
  "icon": "📋",
  "services": [
    {
      "id": "mb91bazo1tm7k3ddab7",
      "name": "Question-backend",
      "type": "backend",
      "cwd": "C:\Users\usuario\question\question-backend",
      "script": "gradlew bootRun",
      "port": 8080,
      "order": 1,
      "url": null,
      "readyKeywords": ["Started", "port 8080"]
    }
  ],
  "lastStartedAt": "2025-05-29T07:54:58.869Z"
}

Campos de un proyecto
----------------------

- id: Identificador único del proyecto.
- name: Nombre del proyecto.
- description: Descripción breve.
- icon: Emoji o icono representativo.
- services: Array de servicios que forman parte del proyecto.
- lastStartedAt: Última fecha de arranque (opcional, se actualiza sola).

Campos de un servicio
----------------------

- id: Identificador único del servicio.
- name: Nombre del servicio (ej. backend, frontend, etc.).
- type: Tipo de servicio (backend, frontend, database, builder, answer, other).
- cwd: Ruta de trabajo (directorio raíz donde se ejecuta el comando).
- script: Comando para arrancar el servicio (ej. gradlew bootRun, npm start).
- port: Puerto que usa el servicio (opcional, usado para comprobar estado).
- order: Orden de arranque (útil para definir prioridades).
- url: URL opcional que se abre si el servicio tiene una interfaz web.
- readyKeywords: Palabras clave para detectar que el servicio está listo (running).

Notas adicionales
------------------

- Las herramientas de control de puertos (netstat y taskkill) están diseñadas para sistemas Windows.
- Si quieres extender la app a Linux/macOS, tendrías que adaptar esas llamadas (lsof, kill, etc.).
- La consola de la app muestra los logs de stdout y stderr, así como trazas de estado (TRACE, INFO, ERROR).

¡Listo!
