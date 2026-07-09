const VentaCreateDto = require('../dtos/venta/request/ventaCreateDto.js');
const request = require('supertest');
const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');
const Cliente = require('../models/cliente.js');
const Empleado = require('../models/empleado.js');
const Product = require('../models/product.js');
const Price = require('../models/price.js');
const ListaPrecios = require('../models/listaPrecios.js');
const Marca = require('../models/marca.js');

describe('Venta Quantity Validation Tests', () => {
    describe('VentaCreateDto validations', () => {
        test('should accept integer quantities', () => {
            const dto = new VentaCreateDto({
                empleadoId: 1,
                clienteId: 1,
                detalles: [{ productoId: 1, precioId: 1, cantidad: 2 }]
            });
            const validation = dto.validate();
            expect(validation.isValid).toBe(true);
            expect(dto.detalles[0].cantidad).toBe(2);
        });

        test('should accept half quantities (0.5)', () => {
            const dto = new VentaCreateDto({
                empleadoId: 1,
                clienteId: 1,
                detalles: [{ productoId: 1, precioId: 1, cantidad: 0.5 }]
            });
            const validation = dto.validate();
            expect(validation.isValid).toBe(true);
            expect(dto.detalles[0].cantidad).toBe(0.5);
        });

        test('should accept decimal quantities as string with comma (1,5)', () => {
            const dto = new VentaCreateDto({
                empleadoId: 1,
                clienteId: 1,
                detalles: [{ productoId: 1, precioId: 1, cantidad: '1,5' }]
            });
            const validation = dto.validate();
            expect(validation.isValid).toBe(true);
            expect(dto.detalles[0].cantidad).toBe(1.5);
        });

        test('should reject other decimal quantities (e.g. 1.75)', () => {
            const dto = new VentaCreateDto({
                empleadoId: 1,
                clienteId: 1,
                detalles: [{ productoId: 1, precioId: 1, cantidad: 1.75 }]
            });
            const validation = dto.validate();
            expect(validation.isValid).toBe(false);
            expect(validation.errors[0]).toContain('la "cantidad" debe ser en incrementos de 0.5');
        });

        test('should reject quantities less than 0.5', () => {
            const dto = new VentaCreateDto({
                empleadoId: 1,
                clienteId: 1,
                detalles: [{ productoId: 1, precioId: 1, cantidad: 0.25 }]
            });
            const validation = dto.validate();
            expect(validation.isValid).toBe(false);
            expect(validation.errors[0]).toContain('debe ser de al menos 0.5');
        });
    });

    describe('API Integration validations for update/create', () => {
        let clienteId, empleadoId, productoId, precioId, ventaId;

        beforeAll(async () => {
            process.env.NODE_ENV = 'test';
            await sequelize.sync({ force: true });

            const m = await Marca.create({ nombre: 'Marca Test' });
            const lp = await ListaPrecios.create({ id: 1, nombre: 'Lista Base' });
            const c = await Cliente.create({ nombre: 'Juan Cliente', direccion: 'Calle 1', contacto: '123456789', listaPreciosId: lp.id });
            clienteId = c.id;

            const e = await Empleado.create({ nombre: 'Pedro Empleado', apellido: 'Gomez', activo: true });
            empleadoId = e.id;

            const p = await Product.create({ nombre: 'Yerba Mate', descripcion: 'Yerba 1kg', activo: true, marcaId: m.id, costo: 50.0 });
            productoId = p.id;

            const pr = await Price.create({ precio: 100.0, productoId: p.id, listaPreciosId: lp.id });
            precioId = pr.id;
        });

        afterAll(async () => {
            await sequelize.close();
        });

        test('POST /ventas - should successfully create a sale with integer quantity', async () => {
            const res = await request(app)
                .post('/ventas')
                .send({
                    empleadoId,
                    clienteId,
                    detalles: [{ productoId, precioId, cantidad: 2 }]
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.detalles[0].cantidad).toBe(2);
            ventaId = res.body.id;
        });

        test('POST /ventas - should successfully create a sale with decimal quantity 1.5', async () => {
            const res = await request(app)
                .post('/ventas')
                .send({
                    empleadoId,
                    clienteId,
                    detalles: [{ productoId, precioId, cantidad: 1.5 }]
                })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.detalles[0].cantidad).toBe(1.5);
        });

        test('PUT /ventas/:id - should successfully update sale details with decimal quantity 1.5', async () => {
            const res = await request(app)
                .put(`/ventas/${ventaId}`)
                .send({
                    activo: true,
                    detalles: [{ productoId, precioId, cantidad: 1.5 }]
                })
                .expect(200);

            expect(res.body.detalles[0].cantidad).toBe(1.5);
        });

        test('PUT /ventas/:id - should fail update if details contain invalid decimal quantity 1.75', async () => {
            const res = await request(app)
                .put(`/ventas/${ventaId}`)
                .send({
                    activo: true,
                    detalles: [{ productoId, precioId, cantidad: 1.75 }]
                })
                .expect(400);

            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toContain('La cantidad debe ser en incrementos de 0.5');
        });
    });
});
