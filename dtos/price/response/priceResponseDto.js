/**
 * DTO para la respuesta de un Precio (Price Response DTO)
 * Se encarga de formatear la salida del precio enviado al cliente,
 * exponiendo únicamente el id, precio y productId.
 */
class PriceResponseDto {
    constructor(price) {
        this.id = price.id;
        this.precioLista1 = parseFloat(parseFloat(price.precioLista1 || 0).toFixed(2));
        this.precioLista2 = parseFloat(parseFloat(price.precioLista2 || 0).toFixed(2));
        this.precioLista3 = parseFloat(parseFloat(price.precioLista3 || 0).toFixed(2));
        this.precioLista4 = parseFloat(parseFloat(price.precioLista4 || 0).toFixed(2));
        this.precioLista5 = parseFloat(parseFloat(price.precioLista5 || 0).toFixed(2));
        this.precioLista6 = parseFloat(parseFloat(price.precioLista6 || 0).toFixed(2));
        this.precioLista7 = parseFloat(parseFloat(price.precioLista7 || 0).toFixed(2));
        this.productId = price.productId;
        this.listaPreciosId = price.listaPreciosId;
        this.listaPrecios = price.listaPrecios ? {
            id: price.listaPrecios.id,
            nombre: price.listaPrecios.nombre
        } : null;
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
