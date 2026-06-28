const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Configurar idioma de Electron en español para que los calendarios (input type="date") se muestren en formato DD/MM/YYYY
app.commandLine.appendSwitch('lang', 'es');

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
const expressApp = require('./app.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    title: 'Distribuidora',
    icon: path.join(__dirname, 'frontend/assets/logo.png')
  });

  const url = 'http://127.0.0.1:3000';
  mainWindow.loadURL(url);

  // Ocultar la barra de menú predeterminada para una interfaz más limpia
  mainWindow.setMenuBarVisibility(false);

  // Limitar navegación para mayor seguridad según electron.md
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.hostname !== '127.0.0.1' && parsedUrl.hostname !== 'localhost') {
      event.preventDefault();
      console.warn(`Navegación bloqueada por seguridad hacia: ${navigationUrl}`);
    }
  });

  // Limitar creación de nuevas ventanas según electron.md
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.warn(`Intento de abrir ventana nueva bloqueado por seguridad: ${url}`);
    return { action: 'deny' };
  });

  // Manejo de fallos de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (validatedURL === url) {
      console.error('No se pudo conectar al servidor Express.');
      dialog.showErrorBox(
        'Error de Conexión',
        'No se pudo conectar con el servidor interno de la aplicación. Por favor, asegúrate de que no haya otra instancia de la aplicación abierta y vuelve a iniciarla.\n\nDetalle: ' + errorDescription
      );
      app.quit();
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  app.setLocale('es');
  console.log('Esperando a que el servidor Express esté listo...');
  
  // Timeout de seguridad de 30 segundos
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout esperando servidor Express')), 30000)
  );

  try {
    await Promise.race([expressApp.serverReady, timeout]);
    console.log('Servidor Express listo. Creando ventana...');
    createWindow();
  } catch (err) {
    console.error('Error al iniciar el servidor interno:', err);
    dialog.showErrorBox(
      'Error de Conexión',
      'No se pudo conectar con el servidor interno de la aplicación en el tiempo establecido. Por favor, asegúrate de que no haya otra instancia de la aplicación abierta y vuelve a iniciarla.'
    );
    app.quit();
  }
});

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
    
    // Temporizador de seguridad de 10 segundos para dar tiempo a Puppeteer/Chromium
    // a cerrar limpiamente y persistir la sesión de WhatsApp
    const forceQuitTimer = setTimeout(() => {
      console.warn('El cierre de sesión de WhatsApp excedió el tiempo límite. Forzando salida...');
      app.exit(0);
    }, 10000);

    const whatsappService = require('./services/whatsappService.js');
    whatsappService.logoutAndDestroy().catch(err => {
      console.error('Error en el cierre de sesión:', err);
    }).finally(() => {
      clearTimeout(forceQuitTimer);
      app.exit(0);
    });
  }
});
