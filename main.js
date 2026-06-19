const { app, BrowserWindow } = require('electron');
const path = require('path');

const fs = require('fs');

// Configurar rutas escribibles en AppData antes de cargar Express
const userDataPath = app.getPath('userData');

// Asegurar que el directorio de datos del usuario exista
fs.mkdirSync(userDataPath, { recursive: true });

const dbPath = path.join(userDataPath, 'database.sqlite');

// Si la base de datos no existe en AppData, copiar la plantilla con datos semilla
if (!fs.existsSync(dbPath)) {
  const templatePath = path.join(__dirname, 'database.template.sqlite');
  if (fs.existsSync(templatePath)) {
    try {
      fs.copyFileSync(templatePath, dbPath);
      console.log('Base de datos inicial inicializada desde la plantilla.');
    } catch (err) {
      console.error('Error al inicializar la base de datos desde la plantilla:', err);
    }
  } else {
    console.warn('Plantilla database.template.sqlite no encontrada.');
  }
}

process.env.DB_PATH = dbPath;
process.env.WHATSAPP_AUTH_PATH = userDataPath;

// Levantar el servidor Express importándolo de forma directa
// Esto inicia automáticamente la sincronización de Sequelize y el listen
require('./app.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    title: 'Distribuidora',
    icon: path.join(__dirname, 'frontend/assets/logo.png')
  });

  const url = 'http://localhost:3000';
  mainWindow.loadURL(url);

  // Ocultar la barra de menú predeterminada para una interfaz más limpia
  mainWindow.setMenuBarVisibility(false);

  // Manejo de reintentos en caso de que Express tarde en levantar (ej. sincronizando DB)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL === url) {
      console.log('El servidor Express aún no responde. Reintentando cargar la URL en 500ms...');
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.loadURL(url);
        }
      }, 500);
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

let isQuitting = false;

app.on('before-quit', (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;
    
    console.log('Cerrando sesión de WhatsApp antes de salir de la aplicación...');
    
    // Temporizador de seguridad de 3 segundos para evitar que la app quede en segundo plano (modo fantasma)
    const forceQuitTimer = setTimeout(() => {
      console.warn('El cierre de sesión de WhatsApp excedió el tiempo límite. Forzando salida...');
      app.exit(0);
    }, 3000);

    const whatsappService = require('./services/whatsappService.js');
    whatsappService.logoutAndDestroy().catch(err => {
      console.error('Error en el cierre de sesión:', err);
    }).finally(() => {
      clearTimeout(forceQuitTimer);
      app.exit(0);
    });
  }
});
