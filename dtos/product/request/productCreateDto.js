/**
 * DTO para la creación de un Producto (Product Create Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos que envía el cliente para crear un producto.
 */
class ProductCreateDto {
    constructor({ nombre, marca, costo, precios }) {
        this.nombre = typeof nombre === 'string' ? nombre.trim() : null;
        this.marca = typeof marca === 'string' ? marca.trim() : null;
        this.costo = costo !== undefined ? parseFloat(costo) : null;
        
        // Sanitizar el objeto de precios
        this.precios = {};
        if (precios && typeof precios === 'object') {
            for (let i = 1; i <= 7; i++) {
                const val = precios[`lista${i}`];
                // Si está vacío, nulo o no es un número, se asigna 0 por defecto
                const parsedVal = (val !== undefined && val !== null && val !== '') ? parseFloat(val) : 0;
                this.precios[`lista${i}`] = isNaN(parsedVal) ? 0 : parseFloat(parsedVal.toFixed(2));
            }
        } else {
            // Inicializar por defecto en 0
            for (let i = 1; i <= 7; i++) {
                this.precios[`lista${i}`] = 0;
            }
        }
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

        if (this.costo === null || isNaN(this.costo) || this.costo < 0) {
            errors.push('El campo "costo" es obligatorio y debe ser un número válido mayor o igual a 0.');
        }

        // Validar que cada precio de lista sea un número no negativo
        for (let i = 1; i <= 7; i++) {
            const val = this.precios[`lista${i}`];
            if (val === null || isNaN(val) || val < 0) {
                errors.push(`El precio de la lista ${i} debe ser un número válido mayor o igual a 0.`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ProductCreateDto;
