<<<<<<< Updated upstream
const { Empleado } = require('../models/index.js');
const { toEmpleadoOutputDTO } = require('../dtos/empleadoDto.js');
=======
const { Op } = require('sequelize');
const Empleado = require('../models/empleado.js');
const Venta = require('../models/venta.js');
const Detalle = require('../models/detalle.js');
>>>>>>> Stashed changes

/**
 * Crea un nuevo empleado aplicando las reglas de negocio.
 * @param {Object} datos - Objeto de datos que ya pasó por el InputDTO
 * @returns {Object} Empleado formateado según OutputDTO
 */
const crearEmpleado = async (datos) => {
    if (!datos.nombreCompleto) {
        throw new Error('El nombre completo del empleado es obligatorio.');
    }
    const nuevoEmpleado = await Empleado.create(datos);
    return toEmpleadoOutputDTO(nuevoEmpleado);
};

/**
 * Obtiene todos los empleados registrados en la base de datos.
 * @returns {Array} Lista de empleados procesados a través del OutputDTO
 */
const obtenerTodos = async () => {
    const empleados = await Empleado.findAll();
    return empleados.map(empleado => toEmpleadoOutputDTO(empleado));
};

<<<<<<< Updated upstream
module.exports = {
    crearEmpleado,
    obtenerTodos
=======
/**
 * Crea un nuevo empleado.
 * @param {{nombre: string, apellido: string, active?: boolean}} empleadoData Datos limpios del empleado.
 */
exports.create = async (empleadoData) => {
    return await Empleado.create({
        nombre: empleadoData.nombre,
        apellido: empleadoData.apellido,
        active: empleadoData.active !== undefined ? empleadoData.active : true
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
        active: empleadoData.active !== undefined ? empleadoData.active : empleado.active
    });
};

/**
 * Elimina un empleado (con eliminación en cascada manual).
 * @param {number} id ID del empleado a eliminar.
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía.
 */
exports.deleteEmpleado = async (id) => {
    const empleado = await Empleado.findByPk(id);
    if (!empleado) return false;

    // Obtener todas las ventas del empleado
    const ventas = await Venta.findAll({
        where: { empleadoId: id }
    });

    const ventaIds = ventas.map(v => v.id);

    // Si hay ventas, eliminar los detalles primero
    if (ventaIds.length > 0) {
        await Detalle.destroy({
            where: {
                sellId: ventaIds
            }
        });

        // Luego eliminar las ventas
        await Venta.destroy({
            where: { empleadoId: id }
        });
    }

    // Finalmente, eliminar el empleado
    await empleado.destroy();
    return true;
>>>>>>> Stashed changes
};
