const request = require('supertest');
const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');

describe('Parameter Validation Middleware Tests', () => {
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('should return 400 if ID is a string (non-numeric)', async () => {
        const response = await request(app)
            .get('/clientes/abc')
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('El parámetro "id" debe ser un número entero positivo válido.');
    });

    test('should return 400 if ID is negative', async () => {
        const response = await request(app)
            .get('/clientes/-5')
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('El parámetro "id" debe ser un número entero positivo válido.');
    });

    test('should return 400 if ID is zero', async () => {
        const response = await request(app)
            .get('/clientes/0')
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('El parámetro "id" debe ser un número entero positivo válido.');
    });

    test('should return 404 instead of 400 if ID is a valid integer but does not exist', async () => {
        // ID 99999 is valid, so parameter validation passes, but the database will return null, resulting in 404
        await request(app)
            .get('/clientes/99999')
            .expect(404);
    });

    test('should return 400 for other parameter names like productoId', async () => {
        const response = await request(app)
            .get('/prices/product/xyz')
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('El parámetro "productoId" debe ser un número entero positivo válido.');
    });
});
