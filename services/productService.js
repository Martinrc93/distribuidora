const Product = require('../models/product.js');
const Price = require('../models/price.js');
const Detalle = require('../models/detalle.js');

/**
 * Obtiene todos los productos con soporte para paginación.
 * @param {number} page Número de página (1-based).
 * @param {number} limit Cantidad de elementos por página.
 */
exports.getAll = async (page = 1, limit = 10) => {
    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 10;
    const offsetNum = (pageNum - 1) * limitNum;

    // findAndCountAll obtiene los registros y el conteo total para calcular las páginas
    const { count, rows } = await Product.findAndCountAll({
        limit: limitNum,
        offset: offsetNum,
        order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limitNum);

    return {
        total: count,
        paginas: totalPages,
        paginaActual: pageNum,
        limite: limitNum,
        data: rows
    };
};

/**
 * Obtiene todos los productos sin paginación.
 */
exports.getAllWithoutPagination = async () => {
    return await Product.findAll({
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Obtiene un producto por su ID único.
 * @param {number} id ID del producto.
 */
exports.getById = async (id) => {
    return await Product.findByPk(id);
};

/**
 * Crea un nuevo producto en la base de datos.
 * @param {{nombre: string, marca: string, costo: number}} productData Datos filtrados del producto.
 */
exports.create = async (productData) => {
    return await Product.create({
        nombre: productData.nombre,
        marca: productData.marca,
        costo: productData.costo
    });
};

/**
 * Actualiza un producto existente por su ID.
 * @param {number} id ID del producto a actualizar.
 * @param {{nombre?: string, marca?: string, costo?: number}} productData Datos a modificar.
 */
exports.update = async (id, productData) => {
    const product = await Product.findByPk(id);
    if (!product) return null;

    return await product.update({
        nombre: productData.nombre === undefined ? product.nombre : productData.nombre,
        marca: productData.marca === undefined ? product.marca : productData.marca,
        costo: productData.costo === undefined ? product.costo : productData.costo
    });
};

/**
 * Elimina un producto por su ID (con eliminación en cascada manual).
 * @param {number} id ID del producto a eliminar.
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía.
 */
exports.deleteProduct = async (id) => {
    const product = await Product.findByPk(id);
    if (!product) return false;

    // Eliminar los detalles de venta que usan precios de este producto
    // Primero obtener todos los precios del producto
    const precios = await Price.findAll({
        where: { productId: id }
    });

    const precioIds = precios.map(p => p.id);

    // Si hay precios, eliminar los detalles que los usan
    if (precioIds.length > 0) {
        await Detalle.destroy({
            where: {
                priceId: precioIds
            }
        });
    }

    // Eliminar todos los precios del producto
    await Price.destroy({
        where: { productId: id }
    });

    // Finalmente, eliminar el producto
    await product.destroy();
    return true;
};

/**
 * Calcula la ganancia de un producto en base a su costo y un ID de precio de venta específico.
 * @param {number} productId ID del producto.
 * @param {number} priceId ID del registro de precio.
 * @returns {Promise<number>} La ganancia calculada (precio - costo).
 */
exports.getGanancia = async (productId, priceId) => {
    const prodId = Number.parseInt(productId, 10);
    const prcId = Number.parseInt(priceId, 10);

    if (Number.isNaN(prodId) || Number.isNaN(prcId)) {
        throw new TypeError('El ID de producto y el ID de precio deben ser números válidos.');
    }

    const product = await Product.findByPk(prodId);
    if (!product) {
        throw new Error('Producto no encontrado.');
    }

    const priceRecord = await Price.findByPk(prcId);
    if (!priceRecord) {
        throw new Error('Registro de precio no encontrado.');
    }

    if (priceRecord.productId !== product.id) {
        throw new Error('El registro de precio no pertenece al producto especificado.');
    }

    const precio = Number.parseFloat(priceRecord.precio);
    const costo = Number.parseFloat(product.costo);

    return Number.parseFloat((precio - costo).toFixed(2));
};
