/**
 * DTO para la creación de un Pedido.
 * Recibe el JSON crudo del frontend, lo limpia, sanitiza y valida.
 * @param {Object} data - Datos crudos del frontend.
 * @returns {{ empleadoId: number, clienteDestino: string, productos: Array, isValid: boolean, errors: string[] }}
 */
function pedidoCreateDto(data) {
    const errors = [];

    const empleadoId = data.empleadoId !== undefined ? parseInt(data.empleadoId, 10) : null;
    const clienteDestino = typeof data.clienteDestino === 'string' ? data.clienteDestino.trim() : '';

    if (!empleadoId || isNaN(empleadoId)) {
        errors.push('El campo "empleadoId" es obligatorio y debe ser un número válido.');
    }

    const productos = Array.isArray(data.productos) ? data.productos.map((p, index) => {
        const prodId = parseInt(p.productoId, 10);
        const cant = parseInt(p.cantidad, 10);
        const lista = typeof p.precioListaSeleccionado === 'string' ? p.precioListaSeleccionado.trim() : null;

        if (isNaN(prodId) || prodId <= 0) {
            errors.push(`El producto en la posición ${index} tiene un "productoId" inválido.`);
        }
        if (isNaN(cant) || cant <= 0) {
            errors.push(`El producto en la posición ${index} tiene una "cantidad" menor o igual a 0.`);
        }
        if (!lista) {
            errors.push(`El producto en la posición ${index} no tiene una "precioListaSeleccionado" válida.`);
        }

        return {
            productoId: prodId,
            cantidad: cant,
            precioListaSeleccionado: lista
        };
    }) : [];

    if (productos.length === 0) {
        errors.push('El pedido debe contener al menos un producto.');
    }

    return {
        empleadoId,
        clienteDestino,
        productos,
        isValid: errors.length === 0,
        errors
    };
}

module.exports = pedidoCreateDto;
