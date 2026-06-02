const Price = require('../models/price.js');

/**
 * Obtiene todos los precios asociados a un Product ID.
 * @param {number} productId ID del producto.
 */
exports.findByProductId = async (productId) => {
    return await Price.findAll({
        where: { productId },
        order: [['createdAt', 'DESC']]
    });
};

exports.create = async (priceData) => {
    return await Price.create({
        precioLista1: priceData.precioLista1,
        precioLista2: priceData.precioLista2,
        precioLista3: priceData.precioLista3,
        precioLista4: priceData.precioLista4,
        precioLista5: priceData.precioLista5,
        precioLista6: priceData.precioLista6,
        precioLista7: priceData.precioLista7,
        productId: priceData.productId
    });
};

/**
 * Actualiza un registro de precio específico por su ID único.
 * @param {number} id ID del precio.
 * @param {{precio: number, productId?: number}} priceData Datos del DTO.
 */
exports.update = async (id, priceData) => {
    const priceRecord = await Price.findByPk(id);
    if (!priceRecord) return null;

    return await priceRecord.update({
        precioLista1: priceData.precioLista1 !== undefined ? priceData.precioLista1 : priceRecord.precioLista1,
        precioLista2: priceData.precioLista2 !== undefined ? priceData.precioLista2 : priceRecord.precioLista2,
        precioLista3: priceData.precioLista3 !== undefined ? priceData.precioLista3 : priceRecord.precioLista3,
        precioLista4: priceData.precioLista4 !== undefined ? priceData.precioLista4 : priceRecord.precioLista4,
        precioLista5: priceData.precioLista5 !== undefined ? priceData.precioLista5 : priceRecord.precioLista5,
        precioLista6: priceData.precioLista6 !== undefined ? priceData.precioLista6 : priceRecord.precioLista6,
        precioLista7: priceData.precioLista7 !== undefined ? priceData.precioLista7 : priceRecord.precioLista7,
        productId: priceData.productId !== undefined ? priceData.productId : priceRecord.productId
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

    await priceRecord.destroy();
    return true;
};
