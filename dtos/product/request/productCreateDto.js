/**
 * DTO para la creación de un Producto (Product Create Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos que envía el cliente para crear un producto.
 */
class ProductCreateDto {
    constructor({ nombre, marca }) {
        this.nombre = typeof nombre === 'string' ? nombre.trim() : null;
        this.marca = typeof marca === 'string' ? marca.trim() : null;
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

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ProductCreateDto;
