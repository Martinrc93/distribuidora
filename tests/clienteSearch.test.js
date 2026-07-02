const sequelize = require('../config/db/dataBase.js');
const Cliente = require('../models/cliente.js');
const ListaPrecios = require('../models/listaPrecios.js');
const { getAll } = require('../services/clienteService.js');

describe('Cliente Search & Pagination Tests', () => {
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });
        // Create default list price
        await ListaPrecios.create({ id: 1, nombre: 'Lista 1' });

        // Seed some test clients
        await Cliente.bulkCreate([
            { nombre: 'Mateo Messi', direccion: 'Rosario 123', contacto: '54 9 341 111111', listaPreciosId: 1 },
            { nombre: 'Cristiano Ronaldo', direccion: 'Funchal 456', contacto: '351 9 222222', listaPreciosId: 1 },
            { nombre: 'Lionel Scaloni', direccion: 'Pujato 789', contacto: '54 9 3464 333333', listaPreciosId: 1 },
            { nombre: 'Angel Di Maria', direccion: 'Rosario 999', contacto: '54 9 341 444444', listaPreciosId: 1 }
        ]);
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('should return all clients when query is empty', async () => {
        const result = await getAll(1, 10, '');
        expect(result.total).toBe(4);
        expect(result.data.length).toBe(4);
    });

    test('should filter clients by name', async () => {
        const result = await getAll(1, 10, 'Messi');
        expect(result.total).toBe(1);
        expect(result.data[0].nombre).toBe('Mateo Messi');
    });

    test('should filter clients by address', async () => {
        const result = await getAll(1, 10, 'Rosario');
        expect(result.total).toBe(2); // Mateo Messi and Angel Di Maria both live in Rosario
        const names = result.data.map(c => c.nombre);
        expect(names).toContain('Mateo Messi');
        expect(names).toContain('Angel Di Maria');
    });

    test('should filter clients by contact', async () => {
        const result = await getAll(1, 10, '351 9');
        expect(result.total).toBe(1);
        expect(result.data[0].nombre).toBe('Cristiano Ronaldo');
    });

    test('should handle paginating filtered results', async () => {
        const resultPage1 = await getAll(1, 1, 'Rosario');
        expect(resultPage1.total).toBe(2);
        expect(resultPage1.paginas).toBe(2);
        expect(resultPage1.data.length).toBe(1);

        const resultPage2 = await getAll(2, 1, 'Rosario');
        expect(resultPage2.total).toBe(2);
        expect(resultPage2.data.length).toBe(1);
        expect(resultPage2.data[0].id).not.toBe(resultPage1.data[0].id);
    });

    test('should return empty data when no match found', async () => {
        const result = await getAll(1, 10, 'NonExistentClientName');
        expect(result.total).toBe(0);
        expect(result.data.length).toBe(0);
    });
});
