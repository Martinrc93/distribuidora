const { app, BrowserWindow } = require('electron');
const path = require('path');

// Configurar rutas escribibles en AppData antes de cargar Express
const userDataPath = app.getPath('userData');
process.env.DB_PATH = path.join(userDataPath, 'database.sqlite');
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
