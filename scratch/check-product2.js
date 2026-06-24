const sequelize = require('../config/db/dataBase.js');
const Product = require('../models/product.js');
const Marca = require('../models/marca.js');
const Price = require('../models/price.js');
const productService = require('../services/productService.js');
const priceService = require('../services/priceService.js');

async function test() {
    try {
        console.log('Inicializando DB y pragmas...');
        await sequelize.authenticate();
        console.log('Autenticación exitosa.');

        // Crear producto de prueba
        console.log('Creando producto de prueba...');
        const productDto = {
            nombre: 'Producto Test ' + Date.now(),
            marca: 'Marca Test',
            costo: 100.50
        };

        const nuevo = await productService.create(productDto);
        console.log('Producto creado exitosamente:', nuevo.toJSON());

        // Intentar actualizar el producto
        console.log('Intentando actualizar el producto...');
        const updateDto = {
            nombre: 'Producto Test Editado',
            costo: 120.00
        };
        const editado = await productService.update(nuevo.id, updateDto);
        console.log('Producto editado exitosamente:', editado.toJSON());

        // Intentar borrar
        console.log('Intentando borrar producto...');
        const borrado = await productService.deleteProduct(nuevo.id);
        console.log('Borrado exitoso:', borrado);

        process.exit(0);
    } catch (err) {
        console.error('ERROR EN TEST:', err);
        process.exit(1);
    }
}

test();
