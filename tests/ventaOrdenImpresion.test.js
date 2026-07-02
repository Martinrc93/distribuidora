const request = require('supertest');
const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');
const Cliente = require('../models/cliente.js');
const Venta = require('../models/venta.js');
const Empleado = require('../models/empleado.js');
const ListaPrecios = require('../models/listaPrecios.js');

describe('Venta ordenImpresion Integration Tests', () => {
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });
        await ListaPrecios.create({ id: 1, nombre: 'Lista 1' });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    let cliente, empleado, venta1, venta2;

    beforeEach(async () => {
        // Clear table for fresh state each test
        await Venta.destroy({ where: {}, force: true });
        await Empleado.destroy({ where: {}, force: true });
        await Cliente.destroy({ where: {}, force: true });

        empleado = await Empleado.create({
            nombre: 'Emp',
            apellido: 'Test',
            activo: true
        });

        cliente = await Cliente.create({
            nombre: 'Cliente',
            direccion: 'Dir',
            contacto: '123',
            listaPreciosId: 1
        });

        venta1 = await Venta.create({
            total: 100,
            ganancia: 20,
            clienteId: cliente.id,
            empleadoId: empleado.id,
            activo: true, // activo=true means state is generally active, actually our app might use status instead of activo? Wait, the model uses 'activo'. Let's check models/venta.js shortly.
            fecha_emision: new Date()
        });

        venta2 = await Venta.create({
            total: 200,
            ganancia: 40,
            clienteId: cliente.id,
            empleadoId: empleado.id,
            activo: true,
            fecha_emision: new Date()
        });
    });

    test('should successfully assign ordenImpresion to an active order', async () => {
        const response = await request(app)
            .patch(`/ventas/${venta1.id}/orden-impresion`)
            .send({ ordenImpresion: 5 });

        expect(response.status).toBe(200);
        expect(response.body.ordenImpresion).toBe(5);

        const updatedVenta = await Venta.findByPk(venta1.id);
        expect(updatedVenta.ordenImpresion).toBe(5);
    });

    test('should prevent assigning a duplicate ordenImpresion among active orders', async () => {
        // assign 5 to venta1
        await request(app)
            .patch(`/ventas/${venta1.id}/orden-impresion`)
            .send({ ordenImpresion: 5 });

        // try assigning 5 to venta2
        const response = await request(app)
            .patch(`/ventas/${venta2.id}/orden-impresion`)
            .send({ ordenImpresion: 5 });

        expect(response.status).toBe(400);
        expect(response.body.error).toMatch(/duplicate/i); // Expecting some sort of duplicate error message
    });

    test('should clear ordenImpresion when sending null', async () => {
        // Assign first
        await Venta.update({ ordenImpresion: 3 }, { where: { id: venta1.id } });

        const response = await request(app)
            .patch(`/ventas/${venta1.id}/orden-impresion`)
            .send({ ordenImpresion: null });

        expect(response.status).toBe(200);
        expect(response.body.ordenImpresion).toBeNull();
        
        const updatedVenta = await Venta.findByPk(venta1.id);
        expect(updatedVenta.ordenImpresion).toBeNull();
    });
});
