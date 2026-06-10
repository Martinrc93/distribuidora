const Detalle = require('../models/detalle.js');

/**
 * Guarda un detalle de venta en la base de datos.
 * @param {{sellId: number, productId: number, priceId: number, cantidad: number, precio: number}} detalleData Datos del detalle.
 * @param {object} [options] Opciones adicionales de Sequelize (por ejemplo, transacciones).
 */
exports.createDetalle = async (detalleData, options = {}) => {
    return await Detalle.create({
        sellId: detalleData.sellId,
        productId: detalleData.productId,
        priceId: detalleData.priceId,
        cantidad: detalleData.cantidad,
        precio: detalleData.precio
    }, options);
};
