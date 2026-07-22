const request = require('supertest');
const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');
const Cliente = require('../models/cliente.js');
const Venta = require('../models/venta.js');
const Empleado = require('../models/empleado.js');
const ListaPrecios = require('../models/listaPrecios.js');
const Product = require('../models/product.js');
const Price = require('../models/price.js');
const Marca = require('../models/marca.js');
const Detalle = require('../models/detalle.js');

describe('Venta ordenImpresion Integration Tests', () => {
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });
        await ListaPrecios.create({ id: 1, nombre: 'Lista 1' });
        const m = await Marca.create({ nombre: 'Marca Test' });
        const p = await Product.create({ id: 1, nombre: 'Yerba Mate', descripcion: 'Yerba 1kg', activo: true, marcaId: m.id, costo: 50.0 });
        await Price.create({ id: 1, precio: 100.0, productoId: p.id, listaPreciosId: 1 });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    let cliente, empleado, venta1, venta2;

    beforeEach(async () => {
        // Clear table for fresh state each test
        await Detalle.destroy({ where: {}, force: true });
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
        // Inicialmente venta2 es 1, venta1 es 2 (por orden de creación invertido en createVenta)
        const response = await request(app)
            .patch(`/ventas/${venta1.id}/orden-impresion`)
            .send({ ordenImpresion: 1 });

        expect(response.status).toBe(200);
        expect(response.body.ordenImpresion).toBe(1);

        const updated1 = await Venta.findByPk(venta1.id);
        const updated2 = await Venta.findByPk(venta2.id);
        expect(updated1.ordenImpresion).toBe(1);
        expect(updated2.ordenImpresion).toBe(2);
    });

    test('should automatically swap duplicate ordenImpresion among active orders on patch', async () => {
        // 1. Asignar orden a venta1 para tener un estado inicial conocido (venta1=1, venta2=2)
        await request(app)
            .patch(`/ventas/${venta1.id}/orden-impresion`)
            .send({ ordenImpresion: 1 });

        // 2. Intentar asignar 2 a venta1 (el cual tiene venta2). Deberían intercambiar.
        const response = await request(app)
            .patch(`/ventas/${venta1.id}/orden-impresion`)
            .send({ ordenImpresion: 2 });

        expect(response.status).toBe(200);
        expect(response.body.ordenImpresion).toBe(2);

        const updated1 = await Venta.findByPk(venta1.id);
        const updated2 = await Venta.findByPk(venta2.id);
        expect(updated1.ordenImpresion).toBe(2);
        expect(updated2.ordenImpresion).toBe(1);
    });

    test('POST /ventas - should register a new sale/order at first position, pushing others down', async () => {
        // Inicialmente les asignamos órdenes: venta1 = 1, venta2 = 2
        await Venta.update({ ordenImpresion: 1 }, { where: { id: venta1.id } });
        await Venta.update({ ordenImpresion: 2 }, { where: { id: venta2.id } });

        // Creamos una nueva venta/pedido.
        const response = await request(app)
            .post('/ventas')
            .send({
                empleadoId: empleado.id,
                clienteId: cliente.id,
                detalles: [
                    { productoId: 1, precioId: 1, cantidad: 1 }
                ]
            });

        expect(response.status).toBe(201);
        expect(response.body.ordenImpresion).toBe(1);

        const updatedNueva = await Venta.findByPk(response.body.id);
        const updated2 = await Venta.findByPk(venta2.id);
        const updated1 = await Venta.findByPk(venta1.id);

        expect(updatedNueva.ordenImpresion).toBe(1);
        expect(updated1.ordenImpresion).toBe(2);
        expect(updated2.ordenImpresion).toBe(3);
    });

    test('should reject clearing ordenImpresion when sending null', async () => {
        const response = await request(app)
            .patch(`/ventas/${venta1.id}/orden-impresion`)
            .send({ ordenImpresion: null });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('debe ser un número entero positivo');
    });

    describe('swapOrdenImpresion', () => {
        test('should successfully swap ordenImpresion between two orders', async () => {
            // Inicialmente venta2 es 1, venta1 es 2.
            const response = await request(app)
                .patch('/ventas/orden-impresion/swap')
                .send({ id1: venta1.id, id2: venta2.id });

            expect(response.status).toBe(200);

            const updated1 = await Venta.findByPk(venta1.id);
            const updated2 = await Venta.findByPk(venta2.id);

            expect(updated1.ordenImpresion).toBe(1);
            expect(updated2.ordenImpresion).toBe(2);
        });

        test('should return 500 when trying to swap an inactive order', async () => {
            // Desactivamos venta2
            await Venta.update({ activo: false, ordenImpresion: null }, { where: { id: venta2.id } });

            const response = await request(app)
                .patch('/ventas/orden-impresion/swap')
                .send({ id1: venta1.id, id2: venta2.id });

            expect(response.status).toBe(500);
            expect(response.body.error).toContain('inactivos o cancelados');
        });

        test('should return 404 if one of the orders does not exist', async () => {
            const response = await request(app)
                .patch('/ventas/orden-impresion/swap')
                .send({ id1: venta1.id, id2: 999999 });

            expect(response.status).toBe(404);
            expect(response.body.error).toMatch(/no existen/i);
        });

        test('should reject swapping ordenImpresion between different employees', async () => {
            const empleado2 = await Empleado.create({
                nombre: 'Otro',
                apellido: 'Emp',
                activo: true
            });

            const ventaOtroEmpleado = await Venta.create({
                total: 150,
                ganancia: 30,
                clienteId: cliente.id,
                empleadoId: empleado2.id,
                activo: true,
                fecha_emision: new Date()
            });

            const response = await request(app)
                .patch('/ventas/orden-impresion/swap')
                .send({ id1: venta1.id, id2: ventaOtroEmpleado.id });

            expect(response.status).toBe(500);
            expect(response.body.error).toContain('diferentes empleados');
        });

        test('should allow changing employee assigned to a sale via PUT /ventas/:id', async () => {
            const empleadoNuevo = await Empleado.create({
                nombre: 'Nuevo',
                apellido: 'Empleado',
                activo: true
            });

            const response = await request(app)
                .put(`/ventas/${venta1.id}`)
                .send({
                    activo: true,
                    empleadoId: empleadoNuevo.id,
                    detalles: [
                        { productoId: 1, precioId: 1, cantidad: 2.0, precio: 100.0 }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body.empleadoId).toBe(empleadoNuevo.id);
            expect(response.body.empleadoNombre).toBe('Nuevo');
            expect(response.body.empleadoApellido).toBe('Empleado');

            const updatedVenta = await Venta.findByPk(venta1.id);
            expect(updatedVenta.empleadoId).toBe(empleadoNuevo.id);
        });

        test('should allow changing client assigned to a sale via PUT /ventas/:id', async () => {
            const clienteNuevo = await Cliente.create({
                nombre: 'Nuevo Cliente',
                direccion: 'Nueva Dir',
                contacto: '456',
                listaPreciosId: 1
            });

            const response = await request(app)
                .put(`/ventas/${venta1.id}`)
                .send({
                    activo: true,
                    clienteId: clienteNuevo.id,
                    detalles: [
                        { productoId: 1, precioId: 1, cantidad: 2.0, precio: 100.0 }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body.clienteId).toBe(clienteNuevo.id);
            expect(response.body.clienteNombre).toBe('Nuevo Cliente');

            const updatedVenta = await Venta.findByPk(venta1.id);
            expect(updatedVenta.clienteId).toBe(clienteNuevo.id);
        });
    });
});
