const Price = require('../models/price.js');
const ListaPrecios = require('../models/listaPrecios.js');

/**
 * Obtiene todos los precios asociados a un Product ID.
 * @param {number} productId ID del producto.
 */
exports.findByProductId = async (productId) => {
    return await Price.findAll({
        where: { productId },
        include: [{ model: ListaPrecios, as: 'listaPrecios' }],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Crea un nuevo registro de precio.
 * @param {{precio: number, productId: number, listaPreciosId: number}} priceData Datos del DTO.
 */
exports.create = async (priceData) => {
    const nuevoPrecio = await Price.create({
        precio: priceData.precio,
        productId: priceData.productId,
        listaPreciosId: priceData.listaPreciosId
    });
    return await nuevoPrecio.reload({
        include: [{ model: ListaPrecios, as: 'listaPrecios' }]
    });
};

/**
 * Actualiza un registro de precio específico por su ID único.
 * @param {number} id ID del precio.
 * @param {{precio: number, productId?: number, listaPreciosId?: number}} priceData Datos del DTO.
 */
exports.update = async (id, priceData) => {
    const priceRecord = await Price.findByPk(id);
    if (!priceRecord) return null;

    await priceRecord.update({
        precio: priceData.precio,
        productId: priceData.productId !== undefined ? priceData.productId : priceRecord.productId,
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

    await priceRecord.destroy();
    return true;
};
