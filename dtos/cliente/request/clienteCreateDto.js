/**
 * DTO para la creación de un Cliente (Cliente Create Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos que envía el cliente para crear un cliente.
 */
class ClienteCreateDto {
    constructor({ nombre, direccion, listaPreciosId }) {
        this.nombre = typeof nombre === 'string' ? nombre.trim() : null;
        this.direccion = typeof direccion === 'string' ? direccion.trim() : null;
        this.listaPreciosId = listaPreciosId !== undefined && listaPreciosId !== null && Number.isInteger(Number(listaPreciosId)) ? Number(listaPreciosId) : null;
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

        if (this.direccion !== undefined && this.direccion !== null) {
            if (this.direccion.length > 50) {
                errors.push('El campo "direccion" no puede superar los 50 caracteres.');
            }
        }

        if (this.listaPreciosId === null || this.listaPreciosId === undefined) {
            errors.push('El campo "listaPreciosId" es obligatorio y debe ser un numero entero valido.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ClienteCreateDto;
