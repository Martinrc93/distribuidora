const { Op } = require('sequelize');
const sequelize = require('../config/db/dataBase.js');
const Marca = require('../models/marca.js');
const Product = require('../models/product.js');

/**
 * Obtiene todas las marcas con paginación y filtro opcional por nombre.
 * @param {number} page Número de página (1-based).
 * @param {number} limit Cantidad de elementos por página.
 * @param {string} nombreFilter Texto opcional para buscar por nombre (búsqueda parcial).
 */
exports.getAll = async (page = 1, limit = 10, nombreFilter = '') => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offsetNum = (pageNum - 1) * limitNum;

    const where = {};
    if (nombreFilter && nombreFilter.trim() !== '') {
        where.nombre = {
            [Op.like]: `%${nombreFilter.trim()}%`
        };
    }

    const { count, rows } = await Marca.findAndCountAll({
        where,
        limit: limitNum,
        offset: offsetNum,
        order: [[sequelize.fn('lower', sequelize.col('nombre')), 'ASC']]
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
 * Busca una marca por su ID único.
 * @param {number} id ID de la marca.
 */
exports.getById = async (id) => {
    return await Marca.findByPk(id);
};

/**
 * Crea una nueva marca. Si ya existe una eliminada lógicamente (soft-delete), la restaura.
 * @param {{nombre: string}} marcaData Datos de la marca.
 */
exports.create = async (marcaData) => {
    const nombreTrimmed = marcaData.nombre ? marcaData.nombre.trim() : '';

    // Buscar si ya existe la marca (incluyendo registros con soft-delete)
    const marcaExistente = await Marca.findOne({
        where: { nombre: nombreTrimmed },
        paranoid: false
    });

    if (marcaExistente) {
        if (marcaExistente.deletedAt) {
            // Si estaba eliminada por soft-delete, la restauramos
            await marcaExistente.restore();
            return marcaExistente;
        }
    }

    return await Marca.create({
        nombre: marcaData.nombre
    });
};

/**
 * Actualiza una marca existente.
 * @param {number} id ID de la marca.
 * @param {{nombre: string}} marcaData Nuevos datos de la marca.
 */
exports.update = async (id, marcaData) => {
    const marca = await Marca.findByPk(id);
    if (!marca) return null;

    return await marca.update({
        nombre: marcaData.nombre === undefined ? marca.nombre : marcaData.nombre
    });
};

/**
 * Elimina una marca por su ID.
 * @param {number} id ID de la marca a eliminar.
 * @returns {Promise<boolean>} true si se eliminó, false si no existía.
 */
exports.deleteMarca = async (id) => {
    const marca = await Marca.findByPk(id);
    if (!marca) return false;

    // Verificar si existen productos asociados a esta marca
    const productCount = await Product.count({ where: { marcaId: id } });
    if (productCount > 0) {
        const error = new Error('No se puede eliminar la marca porque tiene productos asociados.');
        error.statusCode = 409;
        throw error;
    }

    await marca.destroy();
    return true;
};

/**
 * Obtiene todas las marcas sin paginación ordenadas alfabéticamente.
 */
exports.getAllWithoutPagination = async () => {
    return await Marca.findAll({
        order: [[sequelize.fn('lower', sequelize.col('nombre')), 'ASC']]
    });
};
