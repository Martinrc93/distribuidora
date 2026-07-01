const sequelize = require('../config/db/dataBase.js');
const { Op } = require('sequelize');
const Product = require('../models/product.js');
const Price = require('../models/price.js');
const Detalle = require('../models/detalle.js');
const Marca = require('../models/marca.js');
const Venta = require('../models/venta.js');

/**
 * Obtiene todos los productos con soporte para paginación.
 * @param {number} page Número de página (1-based).
 * @param {number} limit Cantidad de elementos por página.
 */
exports.getAll = async (page = 1, limit = 10, q = '') => {
    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 10;
    const offsetNum = (pageNum - 1) * limitNum;

    const where = {};
    if (q && q.trim() !== '') {
        const queryStr = `%${q.trim()}%`;
        where[Op.or] = [
            { nombre: { [Op.like]: queryStr } },
            { '$marca.nombre$': { [Op.like]: queryStr } }
        ];
    }

    // findAndCountAll obtiene los registros y el conteo total para calcular las páginas
    const { count, rows } = await Product.findAndCountAll({
        where,
        include: [{ model: Marca, as: 'marca' }],
        limit: limitNum,
        offset: offsetNum,
        order: [
            [sequelize.fn('lower', sequelize.col('marca.nombre')), 'ASC'],
            [sequelize.fn('lower', sequelize.col('Product.nombre')), 'ASC']
        ]
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
        include: [
            { model: Marca, as: 'marca' },
            { model: Price, as: 'precios' }
        ],
        order: [
            [sequelize.fn('lower', sequelize.col('marca.nombre')), 'ASC'],
            [sequelize.fn('lower', sequelize.col('Product.nombre')), 'ASC']
        ]
    });
};

/**
 * Obtiene un producto por su ID único.
 * @param {number} id ID del producto.
 */
exports.getById = async (id) => {
    return await Product.findByPk(id, {
        include: [{ model: Marca, as: 'marca' }]
    });
};

/**
 * Crea un nuevo producto en la base de datos.
 * @param {{nombre: string, marca: string, costo: number}} productData Datos filtrados del producto.
 */
exports.create = async (productData) => {
    const [marcaObj] = await Marca.findOrCreate({
        where: { nombre: productData.marca }
    });

    const nuevoProducto = await Product.create({
        nombre: productData.nombre,
        marcaId: marcaObj.id,
        costo: productData.costo
    });

    return await nuevoProducto.reload({
        include: [{ model: Marca, as: 'marca' }]
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

    if (productData.costo !== undefined) {
        const nuevoCosto = Number.parseFloat(productData.costo);
        const preciosExistentes = await Price.findAll({ where: { productoId: id } });
        for (const p of preciosExistentes) {
            if (Number.parseFloat(p.precio) < nuevoCosto) {
                const error = new Error(`El costo ($${nuevoCosto}) no puede ser mayor que el precio de lista existente ($${p.precio}).`);
                error.statusCode = 400;
                throw error;
            }
        }
    }

    let marcaId = product.marcaId;
    if (productData.marca !== undefined) {
        const [marcaObj] = await Marca.findOrCreate({
            where: { nombre: productData.marca }
        });
        marcaId = marcaObj.id;
    }

    await product.update({
        nombre: productData.nombre === undefined ? product.nombre : productData.nombre,
        marcaId: marcaId,
        costo: productData.costo === undefined ? product.costo : productData.costo
    });

    return await product.reload({
        include: [{ model: Marca, as: 'marca' }]
    });
};

/**
 * Elimina un producto por su ID (con eliminación en cascada manual).
 * @param {number} id ID del producto a eliminar.
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía.
 */
exports.deleteProduct = async (id) => {
    const t = await sequelize.transaction({ type: 'IMMEDIATE' });
    try {
        const product = await Product.findByPk(id, { transaction: t });
        if (!product) {
            await t.rollback();
            return false;
        }

        // 0. Obtener los detalles que serán eliminados (para ajustar totales)
        const detallesAEliminar = await Detalle.findAll({
            where: { productoId: id },
            attributes: ['ventaId', 'precio', 'cantidad'],
            transaction: t,
            raw: true
        });
        // Agrupar la suma a restar por venta
        const restaPorVenta = {};
        for (const d of detallesAEliminar) {
            const subtotal = Number.parseFloat(d.precio) * Number.parseInt(d.cantidad, 10);
            restaPorVenta[d.ventaId] = (restaPorVenta[d.ventaId] || 0) + subtotal;
        }

        // 1. Obtener IDs de ventas asociadas al producto (únicos)
        const ventaIds = [...new Set(detallesAEliminar.map(d => d.ventaId))];

        // 2. Eliminar los detalles de venta que pertenecen a este producto
        await Detalle.destroy({
            where: { productoId: id },
            transaction: t
        });

        // 3. Ajustar el total de cada venta restando el subtotal de los productos eliminados
        for (const ventaId of Object.keys(restaPorVenta)) {
            const resta = restaPorVenta[ventaId];
            await Venta.increment({ total: -resta }, { where: { id: ventaId }, transaction: t });
        }

        // 4. Actualizar ventas que ahora no tienen detalles (pasar a cancelado)
        for (const ventaId of ventaIds) {
            const remaining = await Detalle.count({
                where: { ventaId },
                transaction: t
            });
            if (remaining === 0) {
                await Venta.update({ activo: false }, {
                    where: { id: ventaId },
                    transaction: t
                });
            }
        }

        // 5. Eliminar todos los precios del producto
        await Price.destroy({
            where: { productoId: id },
            transaction: t
        });

        // 6. Finalmente, eliminar el producto
        await product.destroy({ transaction: t });
        await t.commit();
        return true;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

/**
 * Calcula la ganancia de un producto en base a su costo y un ID de precio de venta específico.
 * @param {number} productoId ID del producto.
 * @param {number} precioId ID del registro de precio.
 * @returns {Promise<number>} La ganancia calculada (precio - costo).
 */
exports.getGanancia = async (productoId, precioId, options = {}) => {
    const prodId = Number.parseInt(productoId, 10);
    const prcId = Number.parseInt(precioId, 10);

    if (Number.isNaN(prodId) || Number.isNaN(prcId)) {
        throw new TypeError('El ID de producto y el ID de precio deben ser números válidos.');
    }

    const product = await Product.findByPk(prodId, { transaction: options.transaction });
    if (!product) {
        throw new Error('Producto no encontrado.');
    }

    const priceRecord = await Price.findByPk(prcId, { transaction: options.transaction });
    if (!priceRecord) {
        throw new Error('Registro de precio no encontrado.');
    }

    if (priceRecord.productoId !== product.id) {
        throw new Error('El registro de precio no pertenece al producto especificado.');
    }

    const precio = Number.parseFloat(priceRecord.precio);
    const costo = Number.parseFloat(product.costo);

    return Number.parseFloat((precio - costo).toFixed(2));
};
