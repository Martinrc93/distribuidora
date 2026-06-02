/**
 * DTO para la actualización de un Pedido.
 * Recibe el JSON crudo del frontend para actualización, lo limpia y valida.
 * @param {Object} data - Datos crudos del frontend.
 * @returns {Object} Datos del pedido a actualizar.
 */
function pedidoUpdateDto(data) {
    const cleaned = {};

    if (data.empleadoId !== undefined) {
        cleaned.empleadoId = data.empleadoId !== null ? parseInt(data.empleadoId, 10) : null;
    }
    if (data.clienteDestino !== undefined) {
        cleaned.clienteDestino = typeof data.clienteDestino === 'string' ? data.clienteDestino.trim() : null;
    }
    if (data.productos !== undefined && Array.isArray(data.productos)) {
        cleaned.productos = data.productos.map(p => ({
            productoId: parseInt(p.productoId, 10),
            cantidad: parseInt(p.cantidad, 10),
            precioListaSeleccionado: typeof p.precioListaSeleccionado === 'string' ? p.precioListaSeleccionado.trim() : null
        }));
    }

    const errors = [];
    if (cleaned.empleadoId !== undefined && cleaned.empleadoId !== null && isNaN(cleaned.empleadoId)) {
        errors.push('El campo "empleadoId" debe ser numérico.');
    }
    if (cleaned.productos !== undefined) {
        cleaned.productos.forEach((p, index) => {
            if (isNaN(p.productoId) || p.productoId <= 0) {
                errors.push(`El producto en la posición ${index} tiene un "productoId" inválido.`);
            }
            if (isNaN(p.cantidad) || p.cantidad <= 0) {
                errors.push(`El producto en la posición ${index} tiene una "cantidad" inválida.`);
            }
            if (!p.precioListaSeleccionado) {
                errors.push(`El producto en la posición ${index} no tiene una "precioListaSeleccionado" válida.`);
            }
        });
    }

    cleaned.errors = errors;
    cleaned.isValid = errors.length === 0;

    return cleaned;
}

module.exports = pedidoUpdateDto;
