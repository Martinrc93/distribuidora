const Detalle = require('../models/detalle.js');

/**
 * Guarda un detalle de venta en la base de datos.
 * @param {{ventaId: number, productoId: number, precioId: number, cantidad: number, precio: number}} detalleData Datos del detalle.
 * @param {object} [options] Opciones adicionales de Sequelize (por ejemplo, transacciones).
 */
exports.createDetalle = async (detalleData, options = {}) => {
    return await Detalle.create({
        ventaId: detalleData.ventaId,
        productoId: detalleData.productoId,
        precioId: detalleData.precioId,
        cantidad: detalleData.cantidad,
        precio: detalleData.precio
    }, options);
};
