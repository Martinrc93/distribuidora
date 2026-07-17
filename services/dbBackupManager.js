const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const sequelize = require('../config/db/dataBase.js');

/**
 * Valida la integridad de una base de datos SQLite ejecutando PRAGMA integrity_check.
 * @param {string} filePath - Ruta al archivo SQLite a validar.
 * @returns {Promise<boolean>}
 */
function checkDatabaseIntegrity(filePath) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return reject(new Error('No se pudo abrir el archivo de base de datos: ' + err.message));
            
            db.get('PRAGMA integrity_check;', (err, row) => {
                db.close();
                if (err) return reject(new Error('El archivo tiene fallos de integridad (no es una base de datos válida): ' + err.message));
                if (row && row.integrity_check === 'ok') {
                    resolve(true);
                } else {
                    reject(new Error('El archivo tiene fallos de integridad: ' + (row ? row.integrity_check : 'vacío')));
                }
            });
        });
    });
}

/**
 * Exporta la base de datos actual ejecutando un checkpoint del WAL y copiando el archivo resultante.
 * @param {string} targetPath - Ruta donde se guardará la base de datos exportada.
 * @returns {Promise<boolean>}
 */
async function exportDatabase(targetPath) {
    const dbPath = process.env.DB_PATH || path.join(app.getPath('userData'), 'database.sqlite');
    
    if (!fs.existsSync(dbPath)) {
        throw new Error('La base de datos original no existe en la ruta especificada.');
    }

    // Asegurar que el WAL se vuelque al archivo de base de datos principal antes de copiar
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) return reject(new Error('No se pudo abrir la base de datos para checkpoint: ' + err.message));
            
            db.run('PRAGMA wal_checkpoint(TRUNCATE);', (err) => {
                db.close();
                if (err) return reject(new Error('Error al vaciar WAL a base principal: ' + err.message));
                
                try {
                    fs.copyFileSync(dbPath, targetPath);
                    resolve(true);
                } catch (copyErr) {
                    reject(new Error('Error al copiar base de datos al destino: ' + copyErr.message));
                }
            });
        });
    });
}

/**
 * Importa una base de datos externa, realizando validación de integridad, backup de emergencia,
 * cierre de conexiones de red y de base de datos, y reiniciando la aplicación.
 * @param {string} sourcePath - Ruta del archivo SQLite a importar.
 * @returns {Promise<void>}
 */
async function importDatabase(sourcePath) {
    // 1. Validar integridad de la base a importar
    await checkDatabaseIntegrity(sourcePath);
    
    const dbPath = process.env.DB_PATH || path.join(app.getPath('userData'), 'database.sqlite');
    const backupsDir = path.join(app.getPath('userData'), 'backups');
    
    if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // 2. Realizar un backup de emergencia de la base actual en el mismo directorio de la base de datos
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const emergencyBackupPath = path.join(path.dirname(dbPath), `backup-db-${timestamp}.sqlite`);
    
    if (fs.existsSync(dbPath)) {
        await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    // Si falla el checkpoint por bloqueo, intentamos copia directa
                    console.warn('Fallo al abrir DB para checkpoint pre-importación, copiando directo:', err.message);
                    try {
                        fs.copyFileSync(dbPath, emergencyBackupPath);
                        return resolve();
                    } catch (copyErr) {
                        return reject(new Error('Error al copiar backup de seguridad directo: ' + copyErr.message));
                    }
                }
                db.run('PRAGMA wal_checkpoint(TRUNCATE);', (err) => {
                    db.close();
                    try {
                        fs.copyFileSync(dbPath, emergencyBackupPath);
                        resolve();
                    } catch (copyErr) {
                        reject(new Error('Error al copiar backup de seguridad tras checkpoint: ' + copyErr.message));
                    }
                });
            });
        });
    }
    
    // 3. Detener operaciones activas (modo mantenimiento) y cerrar servicios
    process.env.MAINTENANCE_MODE = 'true';
    
    // Cerrar servidor Express
    try {
        const expressApp = require('../app.js');
        if (expressApp.serverInstance) {
            await new Promise((resolve) => {
                expressApp.serverInstance.close((err) => {
                    if (err) console.error('Error al cerrar servidor Express:', err);
                    resolve();
                });
            });
        }
    } catch (e) {
        console.error('Error cerrando Express en restauración:', e);
    }
    
    // Cerrar servicio de WhatsApp
    try {
        const whatsappService = require('./whatsappService.js');
        await whatsappService.logoutAndDestroy();
    } catch (e) {
        console.error('Error cerrando WhatsApp en restauración:', e);
    }
    
    // Cerrar conexión de Sequelize para liberar descriptores de archivo
    try {
        await sequelize.close();
    } catch (e) {
        console.error('Error cerrando Sequelize en restauración:', e);
    }
    
    // 4. Reemplazar base de datos principal y limpiar archivos WAL/SHM viejos
    fs.copyFileSync(sourcePath, dbPath);
    
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(walPath)) {
        try { fs.unlinkSync(walPath); } catch (e) { console.error('Error al remover archivo -wal:', e); }
    }
    if (fs.existsSync(shmPath)) {
        try { fs.unlinkSync(shmPath); } catch (e) { console.error('Error al remover archivo -shm:', e); }
    }
    
    // 5. Reiniciar aplicación Electron
    process.env.MAINTENANCE_MODE = 'false';
    app.relaunch();
    app.exit(0);
}

module.exports = {
    exportDatabase,
    importDatabase
};
