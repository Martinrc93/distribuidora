const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');

async function test() {
    await sequelize.sync();
    const v = await Venta.create({
        empleadoId: 1,
        clienteId: 1,
        total: 100,
        ganancia: 20,
        activo: true
    });
    console.log('Created Venta with ID:', v.id);
    console.log('fechaEmision in JS object:', v.fechaEmision);
    
    const [raw] = await sequelize.query('SELECT fecha_emision FROM Ventas WHERE id = ' + v.id);
    console.log('Raw fecha_emision in SQLite:', raw[0].fecha_emision);
    
    await sequelize.close();
}

test().catch(console.error);
