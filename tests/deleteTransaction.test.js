const sequelize = require('../config/db/dataBase.js');
const Cliente = require('../models/cliente.js');
const Venta = require('../models/venta.js');
const Detalle = require('../models/detalle.js');
const Empleado = require('../models/empleado.js');
const ListaPrecios = require('../models/listaPrecios.js');
const { deleteCliente } = require('../services/clienteService.js');

describe('Transactional Delete Tests', () => {
    beforeAll(async () => {
        // Set environment to test
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });
        // Create default list price
        await ListaPrecios.create({ id: 1, nombre: 'Lista 1' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('should roll back changes if deletion fails midway', async () => {
        // Create an employee
        const empleado = await Empleado.create({
            nombre: 'Juan',
            apellido: 'Perez',
            activo: true
        });

        // Create a client
        const cliente = await Cliente.create({
            nombre: 'Cliente de Prueba',
            direccion: 'Calle Falsa 123',
            contacto: '5491112345678',
            listaPreciosId: 1
        });

        // Create a sale
        const venta = await Venta.create({
            total: 100.0,
            ganancia: 20.0,
            clienteId: cliente.id,
            empleadoId: empleado.id,
            activo: true,
            fecha_emision: new Date()
        });

        // Mock Detalle.destroy to throw an error, which happens before Venta or Cliente is destroyed
        const originalDestroy = Detalle.destroy;
        Detalle.destroy = jest.fn().mockImplementation(() => {
            throw new Error('Forced destruction failure');
        });

        // Try deleting the client, which should fail and throw
        await expect(deleteCliente(cliente.id)).rejects.toThrow('Forced destruction failure');

        // Restore original destroy method
        Detalle.destroy = originalDestroy;

        // Check that the client and sale still exist in the database (i.e. rolled back!)
        const clientStillExists = await Cliente.findByPk(cliente.id);
        const saleStillExists = await Venta.findByPk(venta.id);

        expect(clientStillExists).not.toBeNull();
        expect(saleStillExists).not.toBeNull();
        expect(clientStillExists.nombre).toBe('Cliente de Prueba');
    });

    test('should successfully delete client, sales and details if no error occurs', async () => {
        // Create an employee
        const empleado = await Empleado.create({
            nombre: 'Juan 2',
            apellido: 'Perez 2',
            activo: true
        });

        // Create a client
        const cliente = await Cliente.create({
            nombre: 'Cliente de Prueba 2',
            direccion: 'Calle Falsa 124',
            contacto: '5491112345679',
            listaPreciosId: 1
        });

        // Create a sale
        const venta = await Venta.create({
            total: 150.0,
            ganancia: 30.0,
            clienteId: cliente.id,
            empleadoId: empleado.id,
            activo: true,
            fecha_emision: new Date()
        });

        // Run deletion
        const result = await deleteCliente(cliente.id);
        expect(result).toBe(true);

        // Check they are deleted (standard query excludes them)
        const clientDeleted = await Cliente.findByPk(cliente.id);
        const saleDeleted = await Venta.findByPk(venta.id);

        expect(clientDeleted).toBeNull();
        expect(saleDeleted).toBeNull();

        // Check that they still exist in the database (soft-delete verification)
        const clientSoftDeleted = await Cliente.findByPk(cliente.id, { paranoid: false });
        const saleSoftDeleted = await Venta.findByPk(venta.id, { paranoid: false });

        expect(clientSoftDeleted).not.toBeNull();
        expect(saleSoftDeleted).not.toBeNull();
        expect(clientSoftDeleted.deletedAt).not.toBeNull();
        expect(saleSoftDeleted.deletedAt).not.toBeNull();
    });
});
