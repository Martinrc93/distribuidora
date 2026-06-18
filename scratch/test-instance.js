const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');

async function check() {
    try {
        const ventas = await Venta.findAll();
        for (const v of ventas) {
            console.log(`id: ${v.id}, fechaEmision: ${v.fechaEmision}, type: ${typeof v.fechaEmision}, dateInstance: ${v.fechaEmision instanceof Date}`);
            const d = new Date(v.fechaEmision);
            console.log(`Parsed date: ${d}, isNaN: ${isNaN(d.getTime())}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

check();
