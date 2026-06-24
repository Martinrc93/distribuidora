const Price = require('../models/price.js');
const ListaPrecios = require('../models/listaPrecios.js');
const Detalle = require('../models/detalle.js');

/**
 * Obtiene todos los precios asociados a un producto ID.
 * @param {number} productoId ID del producto.
 */
exports.findByProductoId = async (productoId) => {
    return await Price.findAll({
        where: { productoId },
        include: [{ model: ListaPrecios, as: 'listaPrecios' }],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Crea un nuevo registro de precio.
 * @param {{precio: number, productoId: number, listaPreciosId: number}} priceData Datos del DTO.
 */
exports.create = async (priceData) => {
    const nuevoPrecio = await Price.create({
        precio: priceData.precio,
        productoId: priceData.productoId,
        listaPreciosId: priceData.listaPreciosId
    });
    return await nuevoPrecio.reload({
        include: [{ model: ListaPrecios, as: 'listaPrecios' }]
    });
};

/**
 * Actualiza un registro de precio específico por su ID único.
 * @param {number} id ID del precio.
 * @param {{precio: number, productoId?: number, listaPreciosId?: number}} priceData Datos del DTO.
 */
exports.update = async (id, priceData) => {
    const priceRecord = await Price.findByPk(id);
    if (!priceRecord) return null;

    await priceRecord.update({
        precio: priceData.precio,
        productoId: priceData.productoId !== undefined ? priceData.productoId : priceRecord.productoId,
        listaPreciosId: priceData.listaPreciosId !== undefined ? priceData.listaPreciosId : priceRecord.listaPreciosId
    });

    return await priceRecord.reload({
        include: [{ model: ListaPrecios, as: 'listaPrecios' }]
    });
};

/**
 * Elimina un registro de precio específico por su ID único.
 * @param {number} id ID del precio.
 * @returns {Promise<boolean>} true si se eliminó, false si no existía.
 */
exports.deletePrice = async (id) => {
    const priceRecord = await Price.findByPk(id);
    if (!priceRecord) return false;

    // Verificar si existen detalles de venta asociados a este precio
    const detalleCount = await Detalle.count({ where: { precioId: id } });
    if (detalleCount > 0) {
        const error = new Error('No se puede eliminar el precio porque tiene detalles de venta asociados.');
        error.statusCode = 409;
        throw error;
    }

    await priceRecord.destroy();
    return true;
};
