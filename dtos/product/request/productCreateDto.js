const sanitizeInput = require('../../sanitize.js');

/**
 * DTO para la creación de un Producto (Product Create Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos que envía el cliente para crear un producto.
 */
class ProductCreateDto {
    constructor({ nombre, marca, costo }) {
        this.nombre = sanitizeInput(nombre);
        this.marca = sanitizeInput(marca);
        const parsedCosto = typeof costo === 'number' ? costo : Number.parseFloat(costo);
        this.costo = Number.isNaN(parsedCosto) ? parsedCosto : Number.parseFloat(parsedCosto.toFixed(2));
    }

    /**
     * Valida los campos requeridos para la creación del producto.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (!this.nombre || this.nombre === '') {
            errors.push('El campo "nombre" es obligatorio y debe ser una cadena de texto no vacía.');
        }

        if (!this.marca || this.marca === '') {
            errors.push('El campo "marca" es obligatorio y debe ser una cadena de texto no vacía.');
        }

        if (this.costo === undefined || this.costo === null || Number.isNaN(this.costo)) {
            errors.push('El campo "costo" es obligatorio y debe ser un número decimal.');
        } else if (this.costo < 0) {
            errors.push('El campo "costo" no puede ser negativo.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ProductCreateDto;
