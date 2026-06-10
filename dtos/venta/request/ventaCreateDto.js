/**
 * DTO para la creación de una Venta (Venta Create Request DTO)
 * Se encarga de recibir, sanitizar y validar los datos para registrar una venta,
 * que consiste en el ID del empleado y una lista de detalles con su productId, priceId y cantidad.
 */
class VentaCreateDto {
    constructor({ empleadoId, clienteId, detalles }) {
        this.empleadoId = typeof empleadoId === 'number' ? empleadoId : Number.parseInt(empleadoId, 10);
        this.clienteId = typeof clienteId === 'number' ? clienteId : Number.parseInt(clienteId, 10);
        this.detalles = Array.isArray(detalles) 
            ? detalles.map(d => ({
                productId: typeof d.productId === 'number' ? d.productId : Number.parseInt(d.productId, 10),
                priceId: typeof d.priceId === 'number' ? d.priceId : Number.parseInt(d.priceId, 10),
                cantidad: typeof d.cantidad === 'number' ? d.cantidad : Number.parseInt(d.cantidad, 10)
              }))
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

        // 3. Validar la lista de Detalles
        if (!this.detalles) {
            errors.push('El campo "detalles" es obligatorio y debe ser una lista (arreglo) de productos a vender.');
        } else if (this.detalles.length === 0) {
            errors.push('La lista de "detalles" no puede estar vacía. Debe ingresar al menos un producto.');
        } else {
            // Validar cada elemento del detalle
            this.detalles.forEach((d, idx) => {
                const itemNum = idx + 1;

                if (!d.productId || Number.isNaN(d.productId)) {
                    errors.push(`Detalle #${itemNum}: el campo "productId" es obligatorio y debe ser un número entero.`);
                } else if (d.productId <= 0) {
                    errors.push(`Detalle #${itemNum}: el "productId" debe ser un ID de producto positivo.`);
                }

                if (!d.priceId || Number.isNaN(d.priceId)) {
                    errors.push(`Detalle #${itemNum}: el campo "priceId" es obligatorio y debe ser un número entero.`);
                } else if (d.priceId <= 0) {
                    errors.push(`Detalle #${itemNum}: el "priceId" debe ser un ID de precio positivo.`);
                }

                if (d.cantidad === undefined || d.cantidad === null || Number.isNaN(d.cantidad)) {
                    errors.push(`Detalle #${itemNum}: el campo "cantidad" es obligatorio y debe ser un número.`);
                } else if (d.cantidad <= 0) {
                    errors.push(`Detalle #${itemNum}: la "cantidad" de producto debe ser de al menos 1.`);
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
