/**
 * DTO para la creación de un Cliente (Cliente Create Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos que envía el cliente para crear un cliente.
 */
class ClienteCreateDto {
    constructor({ nombre, direccion, listaPrecioId }) {
        this.nombre = typeof nombre === 'string' ? nombre.trim() : null;
        this.direccion = typeof direccion === 'string' ? direccion.trim() : null;
        this.listaPrecioId = Number.isInteger(listaPrecioId) ? listaPrecioId : Number.parseInt(listaPrecioId, 10);
    }

    /**
     * Valida los campos requeridos para la creación del cliente.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (!this.nombre || this.nombre === '') {
            errors.push('El campo "nombre" es obligatorio y debe ser una cadena de texto no vacía.');
        } else if (this.nombre.length > 50) {
            errors.push('El campo "nombre" no puede superar los 50 caracteres.');
        }

        if (!this.listaPrecioId || Number.isNaN(this.listaPrecioId) || this.listaPrecioId <= 0) {
            errors.push('El campo "listaPrecioId" es obligatorio y debe ser un número entero válido mayor a cero.');
        }

        if (this.direccion !== undefined && this.direccion !== null) {
            if (this.direccion.length > 50) {
                errors.push('El campo "direccion" no puede superar los 50 caracteres.');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ClienteCreateDto;
