const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        const ventas = await Venta.findAll({ raw: true });
        console.log('Total ventas:', ventas.length);
        console.log(JSON.stringify(ventas, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

check();
