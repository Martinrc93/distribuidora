/**
 * DTO para la respuesta de un Precio (Price Response DTO)
 * Se encarga de formatear la salida del precio enviado al cliente,
 * exponiendo únicamente el id, precio y productId.
 */
class PriceResponseDto {
    constructor(price) {
        this.id = price.id;
        this.precio = parseFloat(parseFloat(price.precio).toFixed(2));
        this.productoId = price.productoId;
        this.listaPreciosId = price.listaPreciosId;
    }

    /**
     * Mapea una instancia (o un arreglo de instancias) del modelo Price al DTO correspondiente.
     * @param {Object|Object[]} data Instancia o arreglo de instancias del modelo Price.
     * @returns {PriceResponseDto|PriceResponseDto[]|null} El DTO formateado.
     */
    static fromModel(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new PriceResponseDto(item));
        }
        return new PriceResponseDto(data);
    }
}

module.exports = PriceResponseDto;
