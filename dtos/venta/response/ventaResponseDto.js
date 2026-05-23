const DetalleResponseDto = require('./detalleResponseDto');

/**
 * DTO para la respuesta de una Venta (Venta Response DTO)
 * Se encarga de formatear la salida del registro de venta y sus detalles asociados al cliente,
 * exponiendo únicamente el id, fechaEmision, total, active, empleadoId y la lista de detalles.
 */
class VentaResponseDto {
    constructor(venta) {
        this.id = venta.id;
        this.fechaEmision = venta.fechaEmision;
        this.total = parseFloat(parseFloat(venta.total).toFixed(2));
        this.active = venta.active;
        this.empleadoId = venta.empleadoId;
        
        // Mapea la lista de detalles si están incluidos/eager-loaded en la consulta
        this.detalles = venta.detalles 
            ? DetalleResponseDto.fromModel(venta.detalles)
            : [];
    }

    /**
     * Mapea una instancia (o un arreglo de instancias) del modelo Venta al DTO correspondiente.
     * @param {Object|Object[]} data Instancia o arreglo de instancias del modelo Venta.
     * @returns {VentaResponseDto|VentaResponseDto[]|null} El DTO formateado.
     */
    static fromModel(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new VentaResponseDto(item));
        }
        return new VentaResponseDto(data);
    }
}

module.exports = VentaResponseDto;
