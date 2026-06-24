/**
 * DTO para la actualización de un Precio (Price Update Request DTO)
 * Se encarga de recibir, sanitizar y validar los datos para actualizar un precio,
 * exigiendo obligatoriamente el id del precio, el nuevo precio decimal y el productId.
 */
class PriceUpdateDto {
    constructor({ id, precio, productoId, listaPreciosId }) {
        this.id = typeof id === 'number' ? id : parseInt(id, 10);
        const parsedPrecio = typeof precio === 'number' ? precio : parseFloat(precio);
        this.precio = isNaN(parsedPrecio) ? parsedPrecio : parseFloat(parsedPrecio.toFixed(2));
        this.productoId = typeof productoId === 'number' ? productoId : parseInt(productoId, 10);
        this.listaPreciosId = typeof listaPreciosId === 'number' ? listaPreciosId : parseInt(listaPreciosId, 10);
    }

    /**
     * Valila los campos obligatorios para la actualización del precio.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (!this.id || isNaN(this.id)) {
            errors.push('El campo "id" es obligatorio y debe ser un número entero válido.');
        } else if (this.id <= 0) {
            errors.push('El campo "id" debe ser un ID positivo.');
        }

        if (this.precio === undefined || this.precio === null || isNaN(this.precio)) {
            errors.push('El campo "precio" es obligatorio y debe ser un número decimal.');
        } else if (this.precio < 0) {
            errors.push('El campo "precio" no puede ser negativo.');
        }

        if (!this.productoId || isNaN(this.productoId)) {
            errors.push('El campo "productoId" es obligatorio y debe ser un número entero válido.');
        } else if (this.productoId <= 0) {
            errors.push('El campo "productoId" debe ser un ID de producto positivo.');
        }

        if (!this.listaPreciosId || isNaN(this.listaPreciosId)) {
            errors.push('El campo "listaPreciosId" es obligatorio y debe ser un número entero válido.');
        } else if (this.listaPreciosId <= 0) {
            errors.push('El campo "listaPreciosId" debe ser un ID de lista de precios positivo.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = PriceUpdateDto;
