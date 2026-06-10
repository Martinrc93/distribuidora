const Product = require('../models/product.js');
<<<<<<< Updated upstream
=======
const Price = require('../models/price.js');
const Detalle = require('../models/detalle.js');
>>>>>>> Stashed changes

/**
 * Obtiene todos los productos con soporte para paginación.
 * @param {number} page Número de página (1-based).
 * @param {number} limit Cantidad de elementos por página.
 */
exports.getAll = async (page = 1, limit = 10) => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
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
 * Obtiene un producto por su ID único.
 * @param {number} id ID del producto.
 */
exports.getById = async (id) => {
    return await Product.findByPk(id);
};

/**
 * Crea un nuevo producto en la base de datos.
 * @param {{nombre: string, marca: string}} productData Datos filtrados del producto.
 */
exports.create = async (productData) => {
    return await Product.create({
        nombre: productData.nombre,
        marca: productData.marca
    });
};

/**
 * Actualiza un producto existente por su ID.
 * @param {number} id ID del producto a actualizar.
 * @param {{nombre?: string, marca?: string}} productData Datos a modificar.
 */
exports.update = async (id, productData) => {
    const product = await Product.findByPk(id);
    if (!product) return null;

    return await product.update({
        nombre: productData.nombre !== undefined ? productData.nombre : product.nombre,
        marca: productData.marca !== undefined ? productData.marca : product.marca
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
