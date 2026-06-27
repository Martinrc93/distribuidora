const request = require('supertest');
const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');
const Marca = require('../models/marca.js');

describe('Marca Soft Delete and Restore Integration Tests', () => {
    beforeEach(async () => {
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('should restore soft-deleted brand when creating it again', async () => {
        // 1. Create brand
        const resCreate = await request(app)
            .post('/marcas')
            .send({ nombre: 'Coca-Cola' })
            .expect(201);
        
        const brandId = resCreate.body.id;
        expect(resCreate.body.nombre).toBe('Coca-Cola');

        // 2. Soft delete the brand
        await request(app)
            .delete(`/marcas/${brandId}`)
            .expect(200);

        // Verify it is not found in active brands
        const resGetActive = await request(app)
            .get(`/marcas/${brandId}`)
            .expect(404);

        // 3. Create the brand again with the same name (should restore)
        const resCreateAgain = await request(app)
            .post('/marcas')
            .send({ nombre: 'Coca-Cola' })
            .expect(201);

        expect(resCreateAgain.body.id).toBe(brandId);
        expect(resCreateAgain.body.nombre).toBe('Coca-Cola');

        // Verify it is active and accessible again
        const resGetAfterRestore = await request(app)
            .get(`/marcas/${brandId}`)
            .expect(200);
        expect(resGetAfterRestore.body.nombre).toBe('Coca-Cola');
    });

    test('should fail when trying to create a brand that is already active', async () => {
        // 1. Create brand
        await request(app)
            .post('/marcas')
            .send({ nombre: 'Pepsi' })
            .expect(201);

        // 2. Try to create the brand again (should fail)
        const resCreateDuplicate = await request(app)
            .post('/marcas')
            .send({ nombre: 'Pepsi' })
            .expect(500); // The API returns 500 when unique constraint validation fails.
    });
});
