/**
 * DTO para la respuesta de un Detalle de Venta (Detalle Response DTO)
 * Se encarga de formatear la salida de cada artículo vendido en una venta,
 * exponiendo únicamente el id, productId, priceId, cantidad, precio unitario y subtotal.
 */
class DetalleResponseDto {
    constructor(detalle) {
        this.id = detalle.id;
        this.productId = detalle.productId;
        this.priceId = detalle.priceId;
        this.cantidad = detalle.cantidad;
        this.precio = parseFloat(parseFloat(detalle.precio).toFixed(2));
        this.subtotal = parseFloat((this.cantidad * this.precio).toFixed(2)); // Subtotal calculado y redondeado
    }

    /**
     * Mapea una instancia (o un arreglo de instancias) del modelo Detalle al DTO correspondiente.
     * @param {Object|Object[]} data Instancia o arreglo de instancias del modelo Detalle.
     * @returns {DetalleResponseDto|DetalleResponseDto[]|null} El DTO formateado.
     */
    static fromModel(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new DetalleResponseDto(item));
        }
        return new DetalleResponseDto(data);
    }
}

module.exports = DetalleResponseDto;
