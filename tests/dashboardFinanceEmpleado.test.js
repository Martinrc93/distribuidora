const request = require('supertest');
const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');
const Empleado = require('../models/empleado.js');
const Cliente = require('../models/cliente.js');
const ListaPrecios = require('../models/listaPrecios.js');
const Product = require('../models/product.js');
const Marca = require('../models/marca.js');
const Price = require('../models/price.js');
const Venta = require('../models/venta.js');
const Detalle = require('../models/detalle.js');
const dashboardService = require('../services/dashboardService.js');

describe('Dashboard Finance Employee Filtering Tests', () => {
    let emp1, emp2;
    let fechaHoy;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        fechaHoy = `${yyyy}-${mm}-${dd}`;

        // Crear empleados
        emp1 = await Empleado.create({ nombre: 'Juan', apellido: 'Perez', activo: true });
        emp2 = await Empleado.create({ nombre: 'Maria', apellido: 'Lopez', activo: true });

        // Crear marca, lista de precios y cliente
        const marca = await Marca.create({ nombre: 'Marca General' });
        const lp = await ListaPrecios.create({ id: 1, nombre: 'Lista Base' });
        const cli = await Cliente.create({ nombre: 'Cliente Test', direccion: 'Calle 123', contacto: '1234', listaPreciosId: lp.id });

        // Crear producto
        const prod = await Product.create({ nombre: 'Producto A', descripcion: 'Desc', costo: 100, marcaId: marca.id });
        const price = await Price.create({ productoId: prod.id, listaPreciosId: lp.id, precio: 250 });

        // Crear venta 1 para Empleado 1
        const v1 = await Venta.create({
            fechaEmision: new Date(),
            total: 500,
            ganancia: 300,
            activo: true,
            empleadoId: emp1.id,
            clienteId: cli.id
        });
        await Detalle.create({ ventaId: v1.id, productoId: prod.id, precioId: price.id, cantidad: 2, precio: 250 });

        // Crear venta 2 para Empleado 2
        const v2 = await Venta.create({
            fechaEmision: new Date(),
            total: 250,
            ganancia: 150,
            activo: true,
            empleadoId: emp2.id,
            clienteId: cli.id
        });
        await Detalle.create({ ventaId: v2.id, productoId: prod.id, precioId: price.id, cantidad: 1, precio: 250 });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('getFinanceStats sin filtro de empleado devuelve totales globales', async () => {
        const stats = await dashboardService.getFinanceStats(fechaHoy, fechaHoy);
        expect(Number(stats.kpis.totalFacturado)).toBe(750);
        expect(Number(stats.kpis.totalGanancia)).toBe(450);
        expect(Number(stats.kpis.totalVentas)).toBe(2);
        expect(Number(stats.kpis.totalCostos)).toBe(300); // 3 unidades * 100 costo
    });

    test('getFinanceStats con filtro de empleado 1 solo incluye sus ventas', async () => {
        const stats = await dashboardService.getFinanceStats(fechaHoy, fechaHoy, emp1.id);
        expect(Number(stats.kpis.totalFacturado)).toBe(500);
        expect(Number(stats.kpis.totalGanancia)).toBe(300);
        expect(Number(stats.kpis.totalVentas)).toBe(1);
        expect(Number(stats.kpis.totalCostos)).toBe(200); // 2 unidades * 100 costo
    });

    test('getFinanceStats con filtro de empleado 2 solo incluye sus ventas', async () => {
        const stats = await dashboardService.getFinanceStats(fechaHoy, fechaHoy, emp2.id);
        expect(Number(stats.kpis.totalFacturado)).toBe(250);
        expect(Number(stats.kpis.totalGanancia)).toBe(150);
        expect(Number(stats.kpis.totalVentas)).toBe(1);
        expect(Number(stats.kpis.totalCostos)).toBe(100); // 1 unidad * 100 costo
    });

    test('GET /dashboard/finance con parametro empleadoId responde con estadisticas filtradas', async () => {
        const res = await request(app)
            .get(`/dashboard/finance?fechaMin=${fechaHoy}&fechaMax=${fechaHoy}&empleadoId=${emp1.id}`)
            .expect(200);

        expect(Number(res.body.kpis.totalFacturado)).toBe(500);
        expect(Number(res.body.kpis.totalGanancia)).toBe(300);
        expect(Number(res.body.kpis.totalVentas)).toBe(1);
        expect(Number(res.body.kpis.totalCostos)).toBe(200);
    });
});
