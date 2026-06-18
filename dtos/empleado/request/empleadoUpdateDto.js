/**
 * DTO para la actualización de un Empleado (Empleado Update Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos enviados para actualizar un empleado.
 */
class EmpleadoUpdateDto {
    constructor(data) {
        if (data.nombre !== undefined) {
            this.nombre = typeof data.nombre === 'string' ? data.nombre.trim() : null;
        }
        if (data.apellido !== undefined) {
            this.apellido = typeof data.apellido === 'string' ? data.apellido.trim() : null;
        }
        if (data.active !== undefined) {
            this.active = data.active === true || data.active === 'true' || data.active === 1;
        }
    }

    /**
     * Valida los campos presentes para la actualización del empleado.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (this.nombre !== undefined && (!this.nombre || this.nombre === '')) {
            errors.push('El campo "nombre" no puede estar vacío si se proporciona.');
        }

        if (this.apellido !== undefined && (!this.apellido || this.apellido === '')) {
            errors.push('El campo "apellido" no puede estar vacío si se proporciona.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = EmpleadoUpdateDto;
