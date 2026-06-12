/**
 * DTO para la respuesta de un Cliente (Cliente Response DTO)
 * Se encarga de formatear la salida del cliente enviado al cliente de la API,
 * exponiendo únicamente el id, nombre y direccion.
 */
class ClienteResponseDto {
    constructor(cliente) {
        this.id = cliente.id;
        this.nombre = cliente.nombre;
        this.direccion = cliente.direccion;
        this.listaPreciosId = cliente.listaPreciosId;
    }

    /**
     * Mapea una instancia (o un arreglo de instancias) del modelo Cliente al DTO correspondiente.
     * @param {Object|Object[]} data Instancia o arreglo de instancias del modelo Cliente.
     * @returns {ClienteResponseDto|ClienteResponseDto[]|null} El DTO formateado.
     */
    static fromModel(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new ClienteResponseDto(item));
        }
        return new ClienteResponseDto(data);
    }
}

module.exports = ClienteResponseDto;
