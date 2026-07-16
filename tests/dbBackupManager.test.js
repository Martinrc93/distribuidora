const fs = require('fs');
const path = require('path');

// Mock electron before importing dbBackupManager or sequelize
jest.mock('electron', () => {
  const localPath = require('path');
  return {
    app: {
      getPath: (name) => {
        if (name === 'userData') return localPath.join(__dirname, 'temp_userData_backup');
        return './';
      },
      getVersion: () => '1.0.0',
      relaunch: jest.fn(),
      exit: jest.fn()
    }
  };
}, { virtual: true });

const dbBackupManager = require('../services/dbBackupManager.js');
const sequelize = require('../config/db/dataBase.js');

describe('Database Backup and Restore Manager', () => {
    const tempDir = path.join(__dirname, 'temp_userData_backup');
    let testDbPath;
    let exportPath;
    let invalidDbPath;

    beforeAll(() => {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        testDbPath = path.join(tempDir, 'database.sqlite');
        exportPath = path.join(tempDir, 'exported.sqlite');
        invalidDbPath = path.join(tempDir, 'invalid.sqlite');
        
        process.env.DB_PATH = testDbPath;
        fs.writeFileSync(invalidDbPath, 'not a sqlite database file at all');
    });

    beforeEach(async () => {
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });
        
        // Crear base de datos física real en disco para que exista
        const sqlite3 = require('sqlite3').verbose();
        await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(testDbPath, (err) => {
                if (err) return reject(err);
                db.serialize(() => {
                    db.run('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT);', (err) => {
                        db.close();
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        });

        // Add some test data
        await sequelize.query('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT);');
        await sequelize.query('INSERT INTO test_table (name) VALUES ("Test Data");');
    });

    afterAll(async () => {
        // Enlazar base de datos antes de limpiar
        try {
            await sequelize.close();
        } catch (e) {}
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('should export database successfully', async () => {
        if (fs.existsSync(exportPath)) {
            fs.unlinkSync(exportPath);
        }
        
        const success = await dbBackupManager.exportDatabase(exportPath);
        expect(success).toBe(true);
        expect(fs.existsSync(exportPath)).toBe(true);
        
        // Verify exported file integrity
        const sqlite3 = require('sqlite3').verbose();
        const check = await new Promise((resolve) => {
            const db = new sqlite3.Database(exportPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) return resolve(false);
                db.get('PRAGMA integrity_check;', (err, row) => {
                    db.close();
                    if (err) return resolve(false);
                    resolve(row && row.integrity_check === 'ok');
                });
            });
        });
        expect(check).toBe(true);
    });

    test('should fail to import an invalid database', async () => {
        await expect(dbBackupManager.importDatabase(invalidDbPath))
            .rejects.toThrow('El archivo tiene fallos de integridad');
    });

    test('should succeed to import a valid database and trigger relaunch', async () => {
        const electron = require('electron');
        
        // Mock sequelize.close
        const originalClose = sequelize.close;
        sequelize.close = jest.fn().mockResolvedValue();

        // Export current valid DB first
        await dbBackupManager.exportDatabase(exportPath);
        
        // Mock app relaunch and exit
        const relaunchMock = electron.app.relaunch;
        const exitMock = electron.app.exit;
        
        await dbBackupManager.importDatabase(exportPath);
        
        // Verificar que se haya creado el backup de emergencia en el mismo directorio de la base de datos
        const dbDir = path.dirname(testDbPath);
        const files = fs.readdirSync(dbDir);
        const hasEmergencyBackup = files.some(f => f.startsWith('backup-db-') && f.endsWith('.sqlite'));
        expect(hasEmergencyBackup).toBe(true);
        
        expect(relaunchMock).toHaveBeenCalled();
        expect(exitMock).toHaveBeenCalledWith(0);

        // Restore sequelize.close
        sequelize.close = originalClose;
    });
});
