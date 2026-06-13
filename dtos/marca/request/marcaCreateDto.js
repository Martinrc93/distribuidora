/**
 * DTO para la creación de una Marca (Brand Create Request DTO)
 */
class MarcaCreateDto {
    constructor({ nombre }) {
        this.nombre = typeof nombre === 'string' ? nombre.trim() : null;
    }

    /**
     * Valida los campos requeridos para la creación de la marca.
     * @returns {{isValid: boolean, errors: string[]}}
     */
    validate() {
        const errors = [];

        if (!this.nombre || this.nombre === '') {
            errors.push('El campo "nombre" es obligatorio y debe ser una cadena de texto no vacía.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = MarcaCreateDto;
