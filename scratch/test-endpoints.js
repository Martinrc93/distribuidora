const request = require('supertest');
const app = require('../app.js');
const sequelize = require('../config/db/dataBase.js');

async function run() {
    try {
        console.log('Esperando a que la DB sincronice en app...');
        await app.serverReady;
        console.log('Express y DB listos. Corriendo tests de endpoints...');

        // 1. Crear producto
        console.log('--- Test POST /products ---');
        const postRes = await request(app)
            .post('/products')
            .send({
                nombre: 'Prod Test Final',
                marca: 'Marca Test Final',
                costo: 50.00
            });
        
        console.log('Status:', postRes.status);
        console.log('Body:', postRes.body);

        if (postRes.status !== 201) {
            throw new Error('Falló creación de producto');
        }

        const prodId = postRes.body.id;

        // 2. Crear precio para el producto
        console.log('--- Test POST /prices ---');
        const priceRes = await request(app)
            .post('/prices')
            .send({
                precio: 85.50,
                productId: prodId,
                listaPreciosId: 1
            });
        console.log('Status:', priceRes.status);
        console.log('Body:', priceRes.body);

        if (priceRes.status !== 201) {
            throw new Error('Falló creación de precio');
        }

        const priceId = priceRes.body.id;

        // 3. Crear pedido (venta)
        console.log('--- Test POST /ventas ---');
        const ventaRes = await request(app)
            .post('/ventas')
            .send({
                empleadoId: 1,
                clienteId: 1,
                detalles: [
                    {
                        productId: prodId,
                        priceId: priceId,
                        cantidad: 3
                    }
                ]
            });
        console.log('Status:', ventaRes.status);
        console.log('Body:', ventaRes.body);

        if (ventaRes.status !== 201) {
            throw new Error('Falló creación de venta');
        }

        // 4. Editar producto
        console.log('--- Test PUT /products/:id ---');
        const putRes = await request(app)
            .put(`/products/${prodId}`)
            .send({
                nombre: 'Prod Test Final Editado',
                costo: 60.00
            });
        console.log('Status:', putRes.status);
        console.log('Body:', putRes.body);

        if (putRes.status !== 200) {
            throw new Error('Falló edición de producto');
        }

        console.log('TODOS LOS ENDPOINTS DE TEST PASARON CORRECTAMENTE.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR EN TEST DE ENDPOINTS:', err);
        process.exit(1);
    }
}

run();
