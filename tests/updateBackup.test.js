const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock electron before importing app or sequelize
jest.mock('electron', () => {
  const localPath = require('path');
  return {
    app: {
      getPath: (name) => {
        if (name === 'userData') return localPath.join(__dirname, 'temp_userData');
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

const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');

describe('System Update, Backup and Maintenance Integration Tests', () => {
    const tempDir = path.join(__dirname, 'temp_userData');

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
});
