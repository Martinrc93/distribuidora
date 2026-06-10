/**
 * DTO para la actualización de un Cliente (Cliente Update Request DTO)
 * Se encarga de limpiar, estructurar y validar los datos que envía el cliente para actualizar un cliente.
 */
class ClienteUpdateDto {
    constructor(data) {
        if (data.nombre !== undefined) {
            this.nombre = typeof data.nombre === 'string' ? data.nombre.trim() : null;
        }
        if (data.direccion !== undefined) {
            this.direccion = typeof data.direccion === 'string' ? data.direccion.trim() : null;
        }
        if (data.listaPreciosId !== undefined) {
            this.listaPreciosId = data.listaPreciosId !== null && Number.isInteger(Number(data.listaPreciosId)) ? Number(data.listaPreciosId) : null;
        }
    }

    /**
     * Valida los campos presentes para la actualización del cliente.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        if (this.nombre !== undefined) {
            if (!this.nombre || this.nombre === '') {
                errors.push('El campo "nombre" no puede estar vacío si se proporciona.');
            } else if (this.nombre.length > 50) {
                errors.push('El campo "nombre" no puede superar los 50 caracteres.');
            }
        }

        if (this.direccion !== undefined && this.direccion !== null) {
            if (this.direccion.length > 50) {
                errors.push('El campo "direccion" no puede superar los 50 caracteres.');
            }
        }

        if (this.listaPreciosId !== undefined) {
            if (this.listaPreciosId === null) {
                errors.push('El campo "listaPreciosId" debe ser un numero entero valido si se proporciona.');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ClienteUpdateDto;
