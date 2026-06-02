const { Empleado } = require('../models/index.js');
const { toEmpleadoOutputDTO } = require('../dtos/empleadoDto.js');

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

module.exports = {
    crearEmpleado,
    obtenerTodos
};
