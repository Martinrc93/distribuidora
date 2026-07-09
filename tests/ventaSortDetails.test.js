const request = require('supertest');
const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');
const Cliente = require('../models/cliente.js');
const Empleado = require('../models/empleado.js');
const Product = require('../models/product.js');
const Price = require('../models/price.js');
const ListaPrecios = require('../models/listaPrecios.js');
const Marca = require('../models/marca.js');

describe('Venta Details Sorting Tests', () => {
    let clienteId, empleadoId;
    let prodAcoDet, prodAcoZet, prodCoca, prodPepsi;
    let priceAcoDet, priceAcoZet, priceCoca, pricePepsi;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        await sequelize.sync({ force: true });

        // Create brands (unsorted)
        const marcaPepsi = await Marca.create({ nombre: 'Pepsi' });
        const marcaAco = await Marca.create({ nombre: 'Aco' });
        const marcaCoca = await Marca.create({ nombre: 'Coca Cola' });

        const lp = await ListaPrecios.create({ id: 1, nombre: 'Lista Base' });
        
        const c = await Cliente.create({ 
            nombre: 'Juan Cliente', 
            direccion: 'Calle 1', 
            contacto: '123456789', 
            listaPreciosId: lp.id 
        });
        clienteId = c.id;

        const e = await Empleado.create({ 
            nombre: 'Pedro Empleado', 
            apellido: 'Gomez', 
            activo: true 
        });
        empleadoId = e.id;

        // Create products
        prodPepsi = await Product.create({ nombre: 'Pepsi 2L', activo: true, marcaId: marcaPepsi.id, costo: 50.0 });
        prodAcoZet = await Product.create({ nombre: 'Zeta Lavandina', activo: true, marcaId: marcaAco.id, costo: 30.0 });
        prodAcoDet = await Product.create({ nombre: 'Aco Detergente', activo: true, marcaId: marcaAco.id, costo: 40.0 });
        prodCoca = await Product.create({ nombre: 'Coca 1L', activo: true, marcaId: marcaCoca.id, costo: 60.0 });

        // Create prices
        pricePepsi = await Price.create({ precio: 100.0, productoId: prodPepsi.id, listaPreciosId: lp.id });
        priceAcoZet = await Price.create({ precio: 80.0, productoId: prodAcoZet.id, listaPreciosId: lp.id });
        priceAcoDet = await Price.create({ precio: 90.0, productoId: prodAcoDet.id, listaPreciosId: lp.id });
        priceCoca = await Price.create({ precio: 110.0, productoId: prodCoca.id, listaPreciosId: lp.id });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    test('POST /ventas - should save details sorted first by brand and then by product name', async () => {
        // Send details in a completely unsorted order: Pepsi, Coca, Zeta, Aco
        const unsortedDetails = [
            { productoId: prodPepsi.id, precioId: pricePepsi.id, cantidad: 1 },
            { productoId: prodCoca.id, precioId: priceCoca.id, cantidad: 2 },
            { productoId: prodAcoZet.id, precioId: priceAcoZet.id, cantidad: 3 },
            { productoId: prodAcoDet.id, precioId: priceAcoDet.id, cantidad: 4 }
        ];

        const res = await request(app)
            .post('/ventas')
            .send({
                empleadoId,
                clienteId,
                detalles: unsortedDetails
            })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.detalles).toHaveLength(4);

        // Expected sorted order:
        // 1. Aco Detergente (Brand: Aco)
        // 2. Zeta Lavandina (Brand: Aco)
        // 3. Coca 1L (Brand: Coca Cola)
        // 4. Pepsi 2L (Brand: Pepsi)
        expect(res.body.detalles[0].productoId).toBe(prodAcoDet.id);
        expect(res.body.detalles[1].productoId).toBe(prodAcoZet.id);
        expect(res.body.detalles[2].productoId).toBe(prodCoca.id);
        expect(res.body.detalles[3].productoId).toBe(prodPepsi.id);
    });

    test('PUT /ventas/:id - should update and save details sorted correctly', async () => {
        // Create an initial sale
        const initialRes = await request(app)
            .post('/ventas')
            .send({
                empleadoId,
                clienteId,
                detalles: [{ productoId: prodPepsi.id, precioId: pricePepsi.id, cantidad: 1 }]
            })
            .expect(201);

        const ventaId = initialRes.body.id;

        // Update details with new unsorted list
        const unsortedUpdateDetails = [
            { productoId: prodCoca.id, precioId: priceCoca.id, cantidad: 1 },
            { productoId: prodAcoDet.id, precioId: priceAcoDet.id, cantidad: 1 }
        ];

        const updateRes = await request(app)
            .put(`/ventas/${ventaId}`)
            .send({
                activo: true,
                detalles: unsortedUpdateDetails
            })
            .expect(200);

        expect(updateRes.body.detalles).toHaveLength(2);
        // Expected sorted order: Aco Detergente (Brand: Aco), then Coca 1L (Brand: Coca Cola)
        expect(updateRes.body.detalles[0].productoId).toBe(prodAcoDet.id);
        expect(updateRes.body.detalles[1].productoId).toBe(prodCoca.id);
    });
});
