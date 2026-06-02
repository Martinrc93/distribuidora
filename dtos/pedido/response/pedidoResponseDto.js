/**
 * DTO para la respuesta de un Pedido.
 * Recibe el objeto de base de datos (con sus relaciones, detalles y empleado)
 * y devuelve un JSON plano y limpio listo para el frontend.
 * @param {Object} pedidoRaw - Instancia cruda de Sequelize del Pedido.
 * @returns {Object} JSON plano y limpio.
 */
function pedidoResponseDto(pedidoRaw) {
    if (!pedidoRaw) return null;
    
    // Convertir de Sequelize a JSON plano
    const pedido = pedidoRaw.toJSON ? pedidoRaw.toJSON() : pedidoRaw;

    return {
        id: pedido.id,
        fecha: pedido.fecha_emision || pedido.fecha || pedido.createdAt,
        clienteDestino: pedido.clienteDestino || '',
        total: pedido.total !== undefined && pedido.total !== null ? parseFloat(pedido.total) : 0,
        ganancia: pedido.ganancia !== undefined && pedido.ganancia !== null ? parseFloat(pedido.ganancia) : 0,
        estado: pedido.estado || (pedido.active !== false ? 'Activo' : 'Inactivo'),
        empleado: pedido.empleado ? {
            id: pedido.empleado.id,
            nombreCompleto: pedido.empleado.nombreCompleto
        } : null,
        detalles: Array.isArray(pedido.detalles) ? pedido.detalles.map(d => ({
            id: d.id,
            productoId: d.productoId,
            productoMarca: d.producto ? d.producto.marca : null,
            cantidad: d.cantidad,
            listaSeleccionada: d.precioListaSeleccionado,
            precioUnitario: d.precioUnitario !== undefined && d.precioUnitario !== null ? parseFloat(d.precioUnitario) : 0,
            subtotal: d.subtotal !== undefined && d.subtotal !== null ? parseFloat(d.subtotal) : 0
        })) : []
    };
}

/**
 * Convierte un Pedido o un arreglo de Pedidos en sus DTOs correspondientes.
 * @param {Object|Object[]} data - Instancia(s) de Pedido.
 * @returns {Object|Object[]|null}
 */
pedidoResponseDto.fromModel = function(data) {
    if (!data) return null;
    if (Array.isArray(data)) {
        return data.map(item => pedidoResponseDto(item));
    }
    return pedidoResponseDto(data);
};

module.exports = pedidoResponseDto;
