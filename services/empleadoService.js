const sequelize = require('../config/db/dataBase.js');
const { Op } = require('sequelize');
const Empleado = require('../models/empleado.js');
const Venta = require('../models/venta.js');
const Detalle = require('../models/detalle.js');

/**
 * Obtiene todos los empleados con paginación y filtro opcional por nombre.
 * @param {number} page Número de página (1-based).
 * @param {number} limit Cantidad de elementos por página.
 * @param {string} nombreFilter Texto opcional para buscar por nombre (búsqueda parcial).
 */
exports.getAll = async (page = 1, limit = 10, nombreFilter = '') => {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offsetNum = (pageNum - 1) * limitNum;

    // Construcción del objeto de condiciones de búsqueda (where)
    const where = {};
    if (nombreFilter && nombreFilter.trim() !== '') {
        where.nombre = {
            [Op.like]: `%${nombreFilter.trim()}%`
        };
    }

    const { count, rows } = await Empleado.findAndCountAll({
        where,
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
 * Busca un empleado por su ID único.
 * @param {number} id ID del empleado.
 */
exports.getById = async (id) => {
    return await Empleado.findByPk(id);
};

/**
 * Crea un nuevo empleado.
 * @param {{nombre: string, apellido: string, activo?: boolean}} empleadoData Datos limpios del empleado.
 */
exports.create = async (empleadoData) => {
    return await Empleado.create({
        nombre: empleadoData.nombre,
        apellido: empleadoData.apellido,
        activo: empleadoData.activo !== undefined ? empleadoData.activo : true
    });
};

/**
 * Actualiza un empleado existente.
 * @param {number} id ID del empleado a modificar.
 * @param {{nombre?: string, apellido?: string}} empleadoData Datos a actualizar.
 */
exports.update = async (id, empleadoData) => {
    const empleado = await Empleado.findByPk(id);
    if (!empleado) return null;

    return await empleado.update({
        nombre: empleadoData.nombre !== undefined ? empleadoData.nombre : empleado.nombre,
        apellido: empleadoData.apellido !== undefined ? empleadoData.apellido : empleado.apellido,
        activo: empleadoData.activo !== undefined ? empleadoData.activo : empleado.activo
    });
};

/**
 * Elimina un empleado de forma lógica (soft delete).
 * No se eliminan sus ventas para preservar el historial.
 * @param {number} id ID del empleado a eliminar.
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía.
 */
exports.deleteEmpleado = async (id) => {
    const empleado = await Empleado.findByPk(id);
    if (!empleado) {
        return false;
    }

    // Al tener paranoid: true, destroy() hará un soft delete (asigna deletedAt)
    // No eliminamos sus ventas ni detalles para preservar el historial.
    await empleado.destroy();
    return true;
};
