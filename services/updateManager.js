const { app, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db/dataBase.js');

let mainWindow = null;
let currentStatus = 'idle';
let downloadedVersion = '';
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
        
        // Esperar 2 segundos para cerrar transacciones pendientes
        await new Promise(r => setTimeout(r, 2000));
        
        sendStatus('backup-running');
        const dbPath = process.env.DB_PATH || path.join(app.getPath('userData'), 'database.sqlite');
        const backupsDir = path.join(app.getPath('userData'), 'backups');
        
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `database-backup-${timestamp}.sqlite`;
        const backupPath = path.join(backupsDir, backupFileName);
        
        // Copiar base
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
        
        sendStatus('closing-database');
        // Cerrar Sequelize
        await sequelize.close();
        
        // Registrar actualización pendiente
        const pendingUpdatePath = path.join(app.getPath('userData'), 'pending-update.json');
        fs.writeFileSync(pendingUpdatePath, JSON.stringify({
            status: 'ready-to-install',
            previousVersion: app.getVersion(),
            targetVersion: downloadedVersion,
            backupPath,
            createdAt: new Date().toISOString()
        }), 'utf8');
        
        // Cerrar express y whatsapp
        try {
            const expressApp = require('../app.js');
            if (expressApp.serverInstance) {
                expressApp.serverInstance.close();
            }
        } catch (e) {
            console.error('Error cerrando Express:', e);
        }
        
        try {
            const whatsappService = require('./whatsappService.js');
            await whatsappService.logoutAndDestroy();
        } catch (e) {
            console.error('Error cerrando WhatsApp:', e);
        }
        
        sendStatus('installing');
        // Instalar actualización
        setTimeout(() => {
            autoUpdater.quitAndInstall(false, true);
        }, 1000);
        
    } catch (err) {
        isUpdateOperationRunning = false;
        process.env.MAINTENANCE_MODE = 'false';
        sendStatus('error', { message: err.message });
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
