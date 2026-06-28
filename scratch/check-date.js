const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');
const VentaResponseDto = require('../dtos/venta/response/ventaResponseDto');

async function test() {
    try {
        const ventas = await Venta.findAll({ limit: 5 });
        const dtos = VentaResponseDto.fromModel(ventas);
        console.log('DTOs:', JSON.stringify(dtos, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

test();
