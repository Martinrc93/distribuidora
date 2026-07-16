const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock electron before importing app or sequelize
jest.mock('electron', () => {
  const localPath = require('path');
  return {
    app: {
      getPath: (name) => {
        if (name === 'userData') return localPath.join(__dirname, 'temp_userData_update');
        return './';
      },
      getVersion: () => '1.0.0',
      isPackaged: false
    },
    ipcMain: {
      handle: jest.fn()
    }
  };
}, { virtual: true });

// Mock electron-updater to run in standard Node environment
jest.mock('electron-updater', () => {
  const EventEmitter = require('events');
  class MockAutoUpdater extends EventEmitter {
    constructor() {
      super();
      this.autoDownload = false;
      this.autoInstallOnAppQuit = false;
    }
    checkForUpdates() { return Promise.resolve(); }
    downloadUpdate() { return Promise.resolve(); }
    quitAndInstall() {}
  }
  return {
    autoUpdater: new MockAutoUpdater()
  };
}, { virtual: true });

const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');

describe('System Update, Backup and Maintenance Integration Tests', () => {
    const tempDir = path.join(__dirname, 'temp_userData_update');

    beforeAll(() => {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        process.env.DB_PATH = path.join(tempDir, 'database.test.sqlite');
    });

    beforeEach(async () => {
        process.env.NODE_ENV = 'test';
        process.env.MAINTENANCE_MODE = 'false';
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('should prevent writing operations when maintenance mode is active', async () => {
        // Activate maintenance mode
        process.env.MAINTENANCE_MODE = 'true';

        // Attempting to create a brand should fail with 503
        const res = await request(app)
            .post('/marcas')
            .send({ nombre: 'Brand Test' });

        expect(res.status).toBe(503);
        expect(res.body.error).toContain('actualización');

        // Deactivate maintenance mode
        process.env.MAINTENANCE_MODE = 'false';

        // Attempting again should succeed
        const resOk = await request(app)
            .post('/marcas')
            .send({ nombre: 'Brand Test' })
            .expect(201);
        expect(resOk.body.nombre).toBe('Brand Test');
    });

    test('should allow GET requests even when maintenance mode is active', async () => {
        // Create an active brand first
        await request(app)
            .post('/marcas')
            .send({ nombre: 'Pepsi' })
            .expect(201);

        // Activate maintenance mode
        process.env.MAINTENANCE_MODE = 'true';

        // GET request should still be allowed
        const res = await request(app)
            .get('/marcas/all')
            .expect(200);
        
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    test('should create a valid SQLite backup and verify its integrity', async () => {
        const dbPath = path.join(tempDir, 'source.sqlite');
        const backupPath = path.join(tempDir, 'database.backup.sqlite');

        // Create a physical SQLite database file
        const sqlite3 = require('sqlite3').verbose();
        await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) return reject(err);
                db.serialize(() => {
                    db.run('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);');
                    db.run('INSERT INTO test (name) VALUES ("Coca-Cola");', (err) => {
                        db.close();
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        });

        // Copy file
        fs.copyFileSync(dbPath, backupPath);
        expect(fs.existsSync(backupPath)).toBe(true);

        // Verify integrity of the backup file
        const verified = await new Promise((resolve) => {
            const db = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) return resolve(false);
                db.get('PRAGMA integrity_check;', (err, row) => {
                    db.close();
                    if (err) return resolve(false);
                    resolve(row && row.integrity_check === 'ok');
                });
            });
        });

        expect(verified).toBe(true);
    });

    test('should execute full updateManager install and restore cycle successfully', async () => {
        const updateManager = require('../services/updateManager.js');
        const electron = require('electron');
        const child_process = require('child_process');
        
        // Mock de métodos de electron y child_process
        electron.app.exit = jest.fn();
        const mockSpawn = jest.fn().mockReturnValue({ unref: jest.fn() });
        child_process.spawn = mockSpawn;

        // Mock sequelize.close para no romper la conexión en memoria global de Jest
        const originalClose = sequelize.close;
        sequelize.close = jest.fn().mockResolvedValue();

        // 1. Crear base de datos física real en disco para que pueda ser copiada por fs.copyFileSync
        const dbPath = path.join(tempDir, 'database.test.sqlite');
        const sqlite3 = require('sqlite3').verbose();
        await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) return reject(err);
                db.serialize(() => {
                    db.run('CREATE TABLE Marcas (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, createdAt DATETIME, updatedAt DATETIME, deletedAt DATETIME);');
                    db.run("INSERT INTO Marcas (nombre, createdAt, updatedAt) VALUES ('TestDataMarca', datetime('now'), datetime('now'));", (err) => {
                        db.close();
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        });

        const mockWindow = {
            isDestroyed: () => false,
            webContents: {
                send: jest.fn()
            }
        };

        // Inicializar el updateManager
        updateManager.initialize(mockWindow);

        // Crear instalador simulado y disparar evento de descarga
        const mockInstallerPath = path.join(tempDir, 'mock-updater.exe');
        fs.writeFileSync(mockInstallerPath, 'dummy installer content');

        const { autoUpdater } = require('electron-updater');
        autoUpdater.emit('update-downloaded', {
            version: '2.0.0',
            downloadedFile: mockInstallerPath
        });

        // Buscar el manejador de la instalación
        const installHandler = electron.ipcMain.handle.mock.calls.find(c => c[0] === 'update:install')[1];
        
        // Ejecutar instalación
        await installHandler();

        // Restaurar close para otros tests
        sequelize.close = originalClose;

        // 2. Verificar la existencia y contenido del backup
        const backupsDir = path.join(tempDir, 'backups');
        expect(fs.existsSync(backupsDir)).toBe(true);

        const backupFiles = fs.readdirSync(backupsDir).filter(f => f.startsWith('database-backup-') && f.endsWith('.sqlite'));
        expect(backupFiles.length).toBe(1);

        const backupDbPath = path.join(backupsDir, backupFiles[0]);
        
        // Comprobar integridad y existencia del dato en el backup usando sqlite3
        const countInBackup = await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(backupDbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) return reject(err);
                db.get("SELECT COUNT(*) as count FROM Marcas WHERE nombre = 'TestDataMarca';", (err, row) => {
                    db.close();
                    if (err) return reject(err);
                    resolve(row ? row.count : 0);
                });
            });
        });
        expect(countInBackup).toBe(1);

        // Verificar pending-update.json
        const pendingUpdatePath = path.join(tempDir, 'pending-update.json');
        expect(fs.existsSync(pendingUpdatePath)).toBe(true);

        const pendingData = JSON.parse(fs.readFileSync(pendingUpdatePath, 'utf8'));
        expect(pendingData.status).toBe('ready-to-install');
        expect(pendingData.targetVersion).toBe('2.0.0');

        // Verificar llamada de spawn con /S --force-run
        expect(mockSpawn).toHaveBeenCalledWith(mockInstallerPath, ['/S', '--force-run'], expect.any(Object));

        // 3. Simular reinicio y verificación de la actualización exitosa
        electron.app.getVersion = () => '2.0.0';
        updateManager.initialize(mockWindow);

        // pending-update.json debe ser eliminado tras procesarse
        expect(fs.existsSync(pendingUpdatePath)).toBe(false);

        // Validar el estado final del resultado
        const statusHandler = electron.ipcMain.handle.mock.calls.find(c => c[0] === 'update:get-status')[1];
        const statusResult = await statusHandler();
        expect(statusResult.lastResult).toBe('success');
        expect(statusResult.lastVersion).toBe('2.0.0');
    });
});
