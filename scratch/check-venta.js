const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');

async function check() {
    try {
        const ventas = await Venta.findAll({ raw: true });
        console.log(ventas.map(v => ({ id: v.id, fecha: v.fechaEmision, type: typeof v.fechaEmision })));
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

check();
