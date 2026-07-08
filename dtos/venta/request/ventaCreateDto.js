/**
 * DTO para la creación de una Venta (Venta Create Request DTO)
 * Se encarga de recibir, sanitizar y validar los datos para registrar una venta,
 * que consiste en el ID del empleado y una lista de detalles con su productoId, precioId y cantidad.
 */
class VentaCreateDto {
    constructor({ empleadoId, clienteId, detalles, ordenImpresion }) {
        this.empleadoId = typeof empleadoId === 'number' ? empleadoId : Number.parseInt(empleadoId, 10);
        this.clienteId = typeof clienteId === 'number' ? clienteId : Number.parseInt(clienteId, 10);
        this.ordenImpresion = typeof ordenImpresion === 'number' ? ordenImpresion : (ordenImpresion ? Number.parseInt(ordenImpresion, 10) : null);
        this.detalles = Array.isArray(detalles) 
            ? detalles.map(d => {
                let parsedCantidad;
                if (typeof d.cantidad === 'number') {
                    parsedCantidad = d.cantidad;
                } else if (typeof d.cantidad === 'string') {
                    parsedCantidad = Number.parseFloat(d.cantidad.replace(',', '.'));
                } else {
                    parsedCantidad = Number.parseFloat(d.cantidad);
                }

                let parsedPrecio = undefined;
                if (d.precio !== undefined && d.precio !== null) {
                    if (typeof d.precio === 'number') {
                        parsedPrecio = d.precio;
                    } else if (typeof d.precio === 'string') {
                        parsedPrecio = Number.parseFloat(d.precio.replace(',', '.'));
                    } else {
                        parsedPrecio = Number.parseFloat(d.precio);
                    }
                }

                return {
                    productoId: typeof d.productoId === 'number' ? d.productoId : Number.parseInt(d.productoId, 10),
                    precioId: typeof d.precioId === 'number' ? d.precioId : Number.parseInt(d.precioId, 10),
                    cantidad: parsedCantidad,
                    precio: parsedPrecio
                };
              })
            : null;
    }

    /**
     * Valida recursivamente la venta y su listado de detalles asociados.
     * @returns {{isValid: boolean, errors: string[]}} Un objeto indicando si es válido y la lista de errores si los hay.
     */
    validate() {
        const errors = [];

        // 1. Validar el ID del Empleado
        if (!this.empleadoId || Number.isNaN(this.empleadoId)) {
            errors.push('El campo "empleadoId" es obligatorio y debe ser un número entero.');
        } else if (this.empleadoId <= 0) {
            errors.push('El campo "empleadoId" debe ser un ID de empleado positivo.');
        }

        // 2. Validar el ID del Cliente
        if (!this.clienteId || Number.isNaN(this.clienteId)) {
            errors.push('El campo "clienteId" es obligatorio y debe ser un número entero.');
        } else if (this.clienteId <= 0) {
            errors.push('El campo "clienteId" debe ser un ID de cliente positivo.');
        }

        // 3. Validar ordenImpresion (si viene)
        if (this.ordenImpresion !== null) {
            if (Number.isNaN(this.ordenImpresion)) {
                errors.push('El campo "ordenImpresion" debe ser un número entero o nulo.');
            } else if (this.ordenImpresion < 1) {
                errors.push('El campo "ordenImpresion" debe ser un número positivo mayor a 0.');
            }
        }

        // 4. Validar la lista de Detalles
        if (!this.detalles) {
            errors.push('El campo "detalles" es obligatorio y debe ser una lista (arreglo) de productos a vender.');
        } else if (this.detalles.length === 0) {
            errors.push('La lista de "detalles" no puede estar vacía. Debe ingresar al menos un producto.');
        } else {
            // Validar cada elemento del detalle
            this.detalles.forEach((d, idx) => {
                const itemNum = idx + 1;

                if (!d.productoId || Number.isNaN(d.productoId)) {
                    errors.push(`Detalle #${itemNum}: el campo "productoId" es obligatorio y debe ser un número entero.`);
                } else if (d.productoId <= 0) {
                    errors.push(`Detalle #${itemNum}: el "productoId" debe ser un ID de producto positivo.`);
                }

                if (!d.precioId || Number.isNaN(d.precioId)) {
                    errors.push(`Detalle #${itemNum}: el campo "precioId" es obligatorio y debe ser un número entero.`);
                } else if (d.precioId <= 0) {
                    errors.push(`Detalle #${itemNum}: el "precioId" debe ser un ID de precio positivo.`);
                }

                if (d.cantidad === undefined || d.cantidad === null || Number.isNaN(d.cantidad)) {
                    errors.push(`Detalle #${itemNum}: el campo "cantidad" es obligatorio y debe ser un número.`);
                } else if (d.cantidad < 0.5) {
                    errors.push(`Detalle #${itemNum}: la "cantidad" de producto debe ser de al menos 0.5.`);
                } else if ((d.cantidad * 2) % 1 !== 0) {
                    errors.push(`Detalle #${itemNum}: la "cantidad" debe ser en incrementos de 0.5 (ej. 0.5, 1, 1.5, 2).`);
                }
                if (d.precio !== undefined && d.precio !== null && (Number.isNaN(d.precio) || d.precio < 0)) {
                    errors.push(`Detalle #${itemNum}: el campo "precio" (personalizado) debe ser un número positivo.`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = VentaCreateDto;
