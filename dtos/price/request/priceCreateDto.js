/**
 * DTO para la creación de un Precio (Price Create Request DTO)
 * Se encarga de recibir, sanitizar y validar los datos para crear un precio.
 */
class PriceCreateDto {
    constructor({ precio, productId }) {
        const parsedPrecio = typeof precio === 'number' ? precio : parseFloat(precio);
        this.precio = isNaN(parsedPrecio) ? parsedPrecio : parseFloat(parsedPrecio.toFixed(2));
        this.productId = typeof productId === 'number' ? productId : parseInt(productId, 10);
    }

    /**
     * Valida los campos requeridos para la creación del precio.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (this.precio === undefined || this.precio === null || isNaN(this.precio)) {
            errors.push('El campo "precio" es obligatorio y debe ser un número decimal.');
        } else if (this.precio < 0) {
            errors.push('El campo "precio" no puede ser negativo.');
        }

        if (!this.productId || isNaN(this.productId)) {
            errors.push('El campo "productId" es obligatorio y debe ser un número entero válido.');
        } else if (this.productId <= 0) {
            errors.push('El campo "productId" debe ser un ID de producto positivo.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = PriceCreateDto;
