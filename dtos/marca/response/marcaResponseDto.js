/**
 * DTO para la respuesta de una Marca (Brand Response DTO)
 */
class MarcaResponseDto {
    constructor(marca) {
        this.id = marca.id;
        this.nombre = marca.nombre;
        this.createdAt = marca.createdAt;
        this.updatedAt = marca.updatedAt;
    }

    /**
     * Mapea una instancia (o un arreglo de instancias) del modelo Marca al DTO correspondiente.
     * @param {Object|Object[]} data Instancia o arreglo de instancias del modelo Marca.
     * @returns {MarcaResponseDto|MarcaResponseDto[]|null} El DTO formateado.
     */
    static fromModel(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new MarcaResponseDto(item));
        }
        return new MarcaResponseDto(data);
    }
}

module.exports = MarcaResponseDto;
