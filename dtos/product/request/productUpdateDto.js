/**
 * DTO para la actualización de un Producto (Product Update Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos que envía el cliente para actualizar un producto.
 */
class ProductUpdateDto {
    constructor(data) {
        if (data.nombre !== undefined) {
            this.nombre = typeof data.nombre === 'string' ? data.nombre.trim() : null;
        }
        if (data.marca !== undefined) {
            this.marca = typeof data.marca === 'string' ? data.marca.trim() : null;
        }
    }

    /**
     * Valida los campos presentes para la actualización del producto.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (this.nombre !== undefined && (!this.nombre || this.nombre === '')) {
            errors.push('El campo "nombre" no puede estar vacío si se proporciona.');
        }

        if (this.marca !== undefined && (!this.marca || this.marca === '')) {
            errors.push('El campo "marca" no puede estar vacío si se proporciona.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ProductUpdateDto;
