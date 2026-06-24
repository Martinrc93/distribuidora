const sanitizeInput = require('../../sanitize.js');

/**
 * DTO para la creación de un Empleado (Empleado Create Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos enviados para crear un empleado.
 */
class EmpleadoCreateDto {
    constructor({ nombre, apellido, activo }) {
        this.nombre = sanitizeInput(nombre);
        this.apellido = sanitizeInput(apellido);
        this.activo = activo !== undefined ? (activo === true || activo === 'true' || activo === 1) : true;
    }

    /**
     * Valida los campos requeridos para la creación del empleado.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (!this.nombre || this.nombre === '') {
            errors.push('El campo "nombre" es obligatorio y debe ser una cadena de texto no vacía.');
        }

        if (!this.apellido || this.apellido === '') {
            errors.push('El campo "apellido" es obligatorio y debe ser una cadena de texto no vacía.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = EmpleadoCreateDto;
