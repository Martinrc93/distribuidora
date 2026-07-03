const sanitizeInput = require('../../sanitize.js');

/**
 * DTO para la actualización de un Producto (Product Update Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos que envía el cliente para actualizar un producto.
 */
class ProductUpdateDto {
    constructor(data) {
        if (data.nombre !== undefined) {
            this.nombre = sanitizeInput(data.nombre);
        }
        if (data.marca !== undefined) {
            this.marca = sanitizeInput(data.marca);
        }
        if (data.costo !== undefined) {
            const parsedCosto = typeof data.costo === 'number' ? data.costo : Number.parseFloat(data.costo);
            this.costo = Number.isNaN(parsedCosto) ? parsedCosto : Number.parseFloat(parsedCosto.toFixed(2));
        }
        if (Array.isArray(data.precios)) {
            // Clone and sanitize each price entry (keep raw numeric values)
            this.precios = data.precios.map(p => ({
                precio: Number.parseFloat(p.precio),
                listaPreciosId: p.listaPreciosId
            }));
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

        if (this.costo !== undefined) {
            if (this.costo === null || this.costo === undefined || Number.isNaN(this.costo)) {
                errors.push('El campo "costo" debe ser un número decimal si se proporciona.');
            } else if (this.costo <= 0) {
                errors.push('El campo "costo" debe ser superior a 0.');
            }
        }
        if (this.precios !== undefined) {
            this.precios.forEach((p, idx) => {
                if (p.precio === undefined || Number.isNaN(p.precio) || p.precio <= 0) {
                    errors.push(`Precio en posición ${idx} debe ser un número positivo.`);
                }
                if (!p.listaPreciosId) {
                    errors.push(`Precio en posición ${idx} debe incluir listaPreciosId.`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ProductUpdateDto;
