const sequelize = require('../config/db/dataBase.js');
const Product = require('../models/product.js');
const Price = require('../models/price.js');
const Detalle = require('../models/detalle.js');

async function run() {
    try {
        const products = await Product.findAll({ limit: 5 });
        console.log('Products:', products.map(p => ({ id: p.id, nombre: p.nombre })));
        
        if (products.length > 0) {
            const targetId = products[0].id;
            console.log(`Checking associations for product ID ${targetId}...`);
            const prices = await Price.findAll({ where: { productId: targetId } });
            console.log('Prices:', prices.map(p => p.id));
            const details = await Detalle.findAll({ where: { productId: targetId } });
            console.log('Details:', details.map(d => d.id));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
run();
