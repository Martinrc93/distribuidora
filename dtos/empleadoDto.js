/**
 * DTO para la creación y manipulación de un Empleado.
 * Filtra y sanitiza los datos, ocultando la estructura interna del modelo.
 */

const toEmpleadoInputDTO = (data) => {
    return {
        nombreCompleto: typeof data.nombreCompleto === 'string' ? data.nombreCompleto.trim() : null,
        activo: data.activo !== undefined ? Boolean(data.activo) : true
    };
};

const toEmpleadoOutputDTO = (empleadoRaw) => {
    if (!empleadoRaw) return null;

    // Extraemos los valores crudos para evitar metadatos del ORM
    const empleado = typeof empleadoRaw.get === 'function' 
        ? empleadoRaw.get({ plain: true }) 
        : (empleadoRaw.toJSON ? empleadoRaw.toJSON() : empleadoRaw);

    return {
        id: empleado.id,
        // Fallback por si la base de datos tiene registros antiguos separados por nombre y apellido
        nombreCompleto: empleado.nombreCompleto || `${empleado.nombre || ''} ${empleado.apellido || ''}`.trim() || 'Empleado Sin Nombre',
        activo: empleado.activo !== undefined ? empleado.activo : true
    };
};

module.exports = {
    toEmpleadoInputDTO,
    toEmpleadoOutputDTO
};