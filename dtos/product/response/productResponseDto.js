/**
 * DTO para la respuesta de un Producto (Product Response DTO)
 * Se encarga de formatear la salida del producto enviado al cliente.
 */
class ProductResponseDto {
    constructor(product) {
        this.id = product.id;
        this.nombre = product.nombre;
        this.marca = product.marca;
        this.costo = product.costo !== undefined ? parseFloat(product.costo) : null;
    }

    /**
     * Mapea una instancia (o un arreglo de instancias) del modelo Product al DTO correspondiente.
     * @param {Object|Object[]} data Instancia o arreglo de instancias del modelo Product.
     * @returns {ProductResponseDto|ProductResponseDto[]|null} El DTO formateado.
     */
    static fromModel(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new ProductResponseDto(item));
        }
        return new ProductResponseDto(data);
    }
}

module.exports = ProductResponseDto;
