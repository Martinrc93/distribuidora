const sanitizeInput = require('../../sanitize.js');

/**
 * DTO para la creación de un Usuario (User Create Request DTO)
 */
class UserCreateDto {
    constructor({ nombre }) {
        this.nombre = sanitizeInput(nombre);
    }

    /**
     * Valida los campos requeridos para la creación del usuario.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (!this.nombre || this.nombre === '') {
            errors.push('El campo "nombre" es obligatorio y debe ser una cadena de texto no vacía.');
        } else if (this.nombre.length > 50) {
            errors.push('El campo "nombre" no puede superar los 50 caracteres.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = UserCreateDto;
