const DetalleResponseDto = require('./detalleResponseDto');

/**
 * DTO para la respuesta de una Venta (Venta Response DTO)
 * Se encarga de formatear la salida del registro de venta y sus detalles asociados al cliente,
 * exponiendo únicamente el id, fechaEmision, total, active, empleadoId y la lista de detalles.
 */
class VentaResponseDto {
    constructor(venta) {
        this.id = venta.id;
        if (venta.fechaEmision) {
            const date = new Date(venta.fechaEmision);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            this.fechaEmision = `${day}-${month}-${year}`;
        } else {
            this.fechaEmision = null;
        }
        this.total = Number.parseFloat(Number.parseFloat(venta.total).toFixed(2));
        this.active = venta.active;
        this.empleadoId = venta.empleadoId;
        this.empleadoNombre = venta.empleado ? venta.empleado.nombre : null;
        this.empleadoApellido = venta.empleado ? venta.empleado.apellido : null;
        this.clienteId = venta.clienteId;
        this.clienteNombre = venta.cliente ? venta.cliente.nombre : null;
        this.ganancia = venta.ganancia !== undefined && venta.ganancia !== null ? Number.parseFloat(Number.parseFloat(venta.ganancia).toFixed(2)) : null;
        
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
