const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db/dataBase.js');

let mainWindow = null;
let currentStatus = 'idle';
let downloadedVersion = '';
let downloadedFilePath = '';
let downloadPercent = 0;
let isUpdateOperationRunning = false;

// Configurar autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

function sendStatus(status, details = {}) {
    currentStatus = status;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update:status', { status, ...details });
    }
}

// Configurar event listeners de autoUpdater
autoUpdater.on('checking-for-update', () => {
    sendStatus('checking');
});

autoUpdater.on('update-available', (info) => {
    downloadedVersion = info.version;
    sendStatus('available', { version: info.version, releaseNotes: info.releaseNotes });
});

autoUpdater.on('update-not-available', () => {
    sendStatus('not-available');
});

autoUpdater.on('download-progress', (progressObj) => {
    downloadPercent = progressObj.percent;
    sendStatus('downloading', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total
    });
});

autoUpdater.on('update-downloaded', (info) => {
    downloadedVersion = info.version;
    downloadedFilePath = info.downloadedFile || '';
    sendStatus('downloaded', { version: info.version });
});

autoUpdater.on('error', (err) => {
    sendStatus('error', { message: err.message || 'Error en el sistema de actualizaciones' });
});



async function doRealInstall() {
    if (isUpdateOperationRunning) return;
    isUpdateOperationRunning = true;
    
    try {
        sendStatus('preparing');
        process.env.MAINTENANCE_MODE = 'true';
        process.env.IS_UPDATING = 'true';
        
        // Esperar 2 segundos para cerrar transacciones pendientes
        await new Promise(r => setTimeout(r, 2000));
        
        sendStatus('closing-database');
        // 1. Cerrar Express para no recibir más peticiones
        try {
            const expressApp = require('../app.js');
            if (expressApp.serverInstance) {
                await new Promise((resolve) => {
                    expressApp.serverInstance.close((err) => {
                        if (err) console.error('Error al cerrar Express:', err);
                        resolve();
                    });
                });
            }
        } catch (e) {
            console.error('Error cerrando Express:', e);
        }
        
        // 2. Cerrar WhatsApp ( Puppeteer/Chromium )
        try {
            const whatsappService = require('./whatsappService.js');
            await whatsappService.logoutAndDestroy();
        } catch (e) {
            console.error('Error cerrando WhatsApp:', e);
        }
        
        // 3. Cerrar Sequelize para volcar WAL a la base de datos principal y liberar el archivo
        await sequelize.close();
        
        // 4. Crear backup de base de datos
        sendStatus('backup-running');
        const dbPath = process.env.DB_PATH || path.join(app.getPath('userData'), 'database.sqlite');
        const backupsDir = path.join(app.getPath('userData'), 'backups');
        
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `database-backup-${timestamp}.sqlite`;
        const backupPath = path.join(backupsDir, backupFileName);
        
        // Copiar archivo SQLite ahora que está cerrado y en estado consistente
        fs.copyFileSync(dbPath, backupPath);
        
        sendStatus('backup-validating');
        // Validar integridad usando sqlite3
        const sqlite3 = require('sqlite3').verbose();
        await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) return reject(new Error('No se pudo abrir el backup: ' + err.message));
                
                db.get('PRAGMA integrity_check;', (err, row) => {
                    db.close();
                    if (err) return reject(new Error('Error al ejecutar integrity_check: ' + err.message));
                    if (row && row.integrity_check === 'ok') {
                        resolve(true);
                    } else {
                        reject(new Error('Fallo en la integridad de la base copiada: ' + (row ? row.integrity_check : 'vacío')));
                    }
                });
            });
        });
        
        // Limpiar backups antiguos
        try {
            const files = fs.readdirSync(backupsDir)
                .filter(f => f.startsWith('database-backup-') && f.endsWith('.sqlite'))
                .map(f => ({ name: f, path: path.join(backupsDir, f), stat: fs.statSync(path.join(backupsDir, f)) }));
            files.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
            if (files.length > 10) {
                for (let i = 10; i < files.length; i++) {
                    fs.unlinkSync(files[i].path);
                }
            }
        } catch (e) {
            console.error('Error limpiando backups antiguos:', e);
        }
        
        // Registrar actualización pendiente
        const pendingUpdatePath = path.join(app.getPath('userData'), 'pending-update.json');
        fs.writeFileSync(pendingUpdatePath, JSON.stringify({
            status: 'ready-to-install',
            previousVersion: app.getVersion(),
            targetVersion: downloadedVersion,
            backupPath,
            createdAt: new Date().toISOString()
        }), 'utf8');
        
        sendStatus('installing');
        
        // 5. Ejecutar instalador en un proceso desprendido (ejecutable aparte)
        if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
            console.log(`Ejecutando actualizador externo en modo CLI silencioso (/S --force-run): ${downloadedFilePath}`);
            const { spawn } = require('child_process');
            const child = spawn(downloadedFilePath, ['/S', '--force-run'], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref();
            
            // Salir de la app inmediatamente para liberar el archivo de la base de datos y ejecutables
            setTimeout(() => {
                app.exit(0);
            }, 1000);
        } else {
            console.warn('No se encontró downloadedFilePath. Usando autoUpdater.quitAndInstall() como fallback.');
            setTimeout(() => {
                autoUpdater.quitAndInstall(false, true);
            }, 1000);
        }
    } catch (err) {
        console.error('Error durante la preparación de la instalación:', err);
        isUpdateOperationRunning = false;
        process.env.MAINTENANCE_MODE = 'false';
        process.env.IS_UPDATING = 'false';
        sendStatus('error', { message: err.message });
        
        try {
            const { dialog } = require('electron');
            dialog.showErrorBox(
                'Fallo en la Actualización',
                `No se pudo procesar la actualización debido a un problema con la base de datos:\n\n${err.message}\n\nLa aplicación se reiniciará para restaurar el estado original.`
            );
        } catch (e) {
            console.error('Error al mostrar cuadro de diálogo de fallo:', e);
        }
        
        try {
            app.relaunch();
            app.exit(0);
        } catch (e) {
            console.error('Error al reiniciar la aplicación tras fallo:', e);
        }
        throw err;
    }
}

function initialize(windowRef) {
    mainWindow = windowRef;
    
    // Check pending updates on startup
    const pendingUpdatePath = path.join(app.getPath('userData'), 'pending-update.json');
    if (fs.existsSync(pendingUpdatePath)) {
        try {
            const pending = JSON.parse(fs.readFileSync(pendingUpdatePath, 'utf8'));
            const currentVersion = app.getVersion();
            
            if (currentVersion === pending.targetVersion) {
                process.env.LAST_UPDATE_RESULT = 'success';
                process.env.LAST_UPDATE_VERSION = currentVersion;
            } else {
                process.env.LAST_UPDATE_RESULT = 'failed';
                process.env.LAST_UPDATE_VERSION = pending.targetVersion;
            }
            fs.unlinkSync(pendingUpdatePath);
        } catch (err) {
            console.error('Error al verificar pending-update:', err);
        }
    }
    
    // Configurar IPC Handlers
    ipcMain.handle('update:get-version', () => {
        return app.getVersion();
    });
    
    ipcMain.handle('update:get-status', () => {
        const res = {
            lastResult: process.env.LAST_UPDATE_RESULT || null,
            lastVersion: process.env.LAST_UPDATE_VERSION || null,
            simulated: false
        };
        // Borrar después del primer consumo
        delete process.env.LAST_UPDATE_RESULT;
        delete process.env.LAST_UPDATE_VERSION;
        return res;
    });
    
    ipcMain.handle('update:check', async () => {
        try {
            await autoUpdater.checkForUpdates();
            return { success: true };
        } catch (err) {
            sendStatus('error', { message: err.message });
            return { error: err.message };
        }
    });
    
    ipcMain.handle('update:download', async () => {
        try {
            await autoUpdater.downloadUpdate();
            return { success: true };
        } catch (err) {
            sendStatus('error', { message: err.message });
            return { error: err.message };
        }
    });
    
    ipcMain.handle('update:install', async () => {
        return await doRealInstall();
    });
}

module.exports = {
    initialize
};
