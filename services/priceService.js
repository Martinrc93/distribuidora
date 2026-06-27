const Price = require('../models/price.js');
const ListaPrecios = require('../models/listaPrecios.js');
const Detalle = require('../models/detalle.js');
const Product = require('../models/product.js');

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
    const product = await Product.findByPk(priceData.productoId);
    if (!product) {
        const error = new Error('El producto especificado no existe.');
        error.statusCode = 404;
        throw error;
    }

    if (Number.parseFloat(priceData.precio) < Number.parseFloat(product.costo)) {
        const error = new Error(`El precio de lista ($${priceData.precio}) no puede ser menor que el costo del producto ($${product.costo}).`);
        error.statusCode = 400;
        throw error;
    }

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

    const precio = priceData.precio !== undefined ? priceData.precio : priceRecord.precio;
    const productoId = priceData.productoId !== undefined ? priceData.productoId : priceRecord.productoId;

    const product = await Product.findByPk(productoId);
    if (!product) {
        const error = new Error('El producto especificado no existe.');
        error.statusCode = 404;
        throw error;
    }

    if (Number.parseFloat(precio) < Number.parseFloat(product.costo)) {
        const error = new Error(`El precio de lista ($${precio}) no puede ser menor que el costo del producto ($${product.costo}).`);
        error.statusCode = 400;
        throw error;
    }

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
