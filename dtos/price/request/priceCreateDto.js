/**
 * DTO para la creación de un Precio (Price Create Request DTO)
 * Se encarga de recibir, sanitizar y validar los datos para crear un precio.
 */
class PriceCreateDto {
    constructor({ precio, precioLista1, precioLista2, precioLista3, precioLista4, precioLista5, precioLista6, precioLista7, productId }) {
        this.precioLista1 = parseFloat(precioLista1 !== undefined ? precioLista1 : (precio !== undefined ? precio : 0));
        this.precioLista2 = parseFloat(precioLista2 !== undefined ? precioLista2 : (precio !== undefined ? precio : 0));
        this.precioLista3 = parseFloat(precioLista3 !== undefined ? precioLista3 : (precio !== undefined ? precio : 0));
        this.precioLista4 = parseFloat(precioLista4 !== undefined ? precioLista4 : (precio !== undefined ? precio : 0));
        this.precioLista5 = parseFloat(precioLista5 !== undefined ? precioLista5 : (precio !== undefined ? precio : 0));
        this.precioLista6 = parseFloat(precioLista6 !== undefined ? precioLista6 : (precio !== undefined ? precio : 0));
        this.precioLista7 = parseFloat(precioLista7 !== undefined ? precioLista7 : (precio !== undefined ? precio : 0));
        this.productId = typeof productId === 'number' ? productId : parseInt(productId, 10);
    }

    /**
     * Valida los campos requeridos para la creación del precio.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        for (let i = 1; i <= 7; i++) {
            const val = this[`precioLista${i}`];
            if (val === undefined || val === null || isNaN(val)) {
                errors.push(`El precio de la lista ${i} es obligatorio.`);
            } else if (val < 0) {
                errors.push(`El precio de la lista ${i} no puede ser negativo.`);
            }
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
