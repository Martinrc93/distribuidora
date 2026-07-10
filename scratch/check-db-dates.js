const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');

async function check() {
    await sequelize.sync();
    const count = await Venta.count();
    console.log('Total ventas:', count);
    
    const [raw] = await sequelize.query('SELECT id, fecha_emision, createdAt FROM Ventas ORDER BY id DESC LIMIT 5');
    console.log('Last 5 Ventas (Raw SQLite values):');
    raw.forEach(r => {
        console.log(`ID: ${r.id}, fecha_emision: ${r.fecha_emision}, createdAt: ${r.createdAt}`);
    });
    
    await sequelize.close();
}

check().catch(console.error);
