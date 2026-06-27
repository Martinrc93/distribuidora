const ventaService = require('../services/ventaService');
const { VentaCreateDto } = require('../dtos/venta/request');
const { VentaResponseDto } = require('../dtos/venta/response');

/**
 * Obtener todas las ventas activas de un empleado específico con paginación y filtro por día opcionales.
 * Ruta: GET /ventas/empleado/:empleadoId?page=1&limit=10&dia=2026-05-22
 */
exports.getByEmpleado = async (req, res) => {
    try {
        const { empleadoId } = req.params;
        const { page = 1, limit = 10, dia = '', fechaMin = '', fechaMax = '' } = req.query;

        const result = await ventaService.getByEmpleado(empleadoId, page, limit, dia, fechaMin, fechaMax);
        
        // Mapear los datos de las ventas al Response DTO
        result.data = VentaResponseDto.fromModel(result.data);

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Registrar una nueva venta completa (cabecera y detalle) de forma atómica.
 * Ruta: POST /ventas
 */
exports.create = async (req, res) => {
    try {
        const ventaDto = new VentaCreateDto(req.body);
        const validation = ventaDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const nuevaVenta = await ventaService.createVenta(ventaDto);
        res.status(201).json(VentaResponseDto.fromModel(nuevaVenta));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Actualizar el estado activo/inactivo (activo) de una venta.
 * Ruta: PUT /ventas/:id/status o PUT /ventas/:id
 */
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo, detalles } = req.body;

        // Validación: el estado activo es obligatorio
        if (activo === undefined || typeof activo !== 'boolean') {
            return res.status(400).json({ error: 'El campo "activo" es obligatorio y debe ser un valor booleano (true/false).' });
        }

        // Si se envían detalles, validarlos
        if (detalles) {
            if (!Array.isArray(detalles) || detalles.length === 0) {
                return res.status(400).json({ error: 'El campo "detalles" debe ser un arreglo no vacío de ítems.' });
            }
            for (let i = 0; i < detalles.length; i++) {
                const item = detalles[i];
                let parsedCantidad;
                if (typeof item.cantidad === 'number') {
                    parsedCantidad = item.cantidad;
                } else if (typeof item.cantidad === 'string') {
                    parsedCantidad = Number.parseFloat(item.cantidad.replace(',', '.'));
                } else {
                    parsedCantidad = Number.parseFloat(item.cantidad);
                }
                item.cantidad = parsedCantidad;

                if (!item.productoId || !item.precioId || isNaN(item.cantidad) || item.cantidad < 1) {
                    return res.status(400).json({ error: `Detalle #${i + 1} inválido. Debe contener productoId, precioId y cantidad mayor o igual a 1.` });
                }
                if (!Number.isInteger(item.cantidad)) {
                    return res.status(400).json({ error: `Detalle #${i + 1} inválido. La cantidad debe ser un número entero (ej. 1, 2, 3).` });
                }
            }
        }

        const ventaActualizada = await ventaService.updateVenta(id, activo, detalles);
        if (!ventaActualizada) {
            return res.status(404).json({ mensaje: 'Venta no encontrada para actualizar' });
        }

        res.json(VentaResponseDto.fromModel(ventaActualizada));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener la última venta activa de un cliente por su ID.
 * Ruta: GET /clientes/:id/ultima-venta
 */
exports.getUltimaVentaByCliente = async (req, res) => {
    try {
        const id = req.params.clienteId || req.params.id;
        const ultimaVenta = await ventaService.getUltimaVenta(id);
        
        if (!ultimaVenta) {
            return res.status(404).json({ mensaje: 'No se encontraron ventas activas para este cliente.' });
        }

        res.json(VentaResponseDto.fromModel(ultimaVenta));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener todas las ventas activas de un cliente con paginación y filtros opcionales de fecha.
 * Ruta: GET /ventas/cliente/:clienteId?page=1&limit=10&fechaMin=YYYY-MM-DD&fechaMax=YYYY-MM-DD
 */
exports.getVentasByCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const { page = 1, limit = 10, fechaMin = '', fechaMax = '' } = req.query;

        const result = await ventaService.getByCliente(clienteId, page, limit, fechaMin, fechaMax);
        
        // Mapear los datos al Response DTO
        result.data = VentaResponseDto.fromModel(result.data);

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener todas las ventas con paginación.
 * Ruta: GET /ventas?page=1&limit=10
 */
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, dia = '', fechaMin = '', fechaMax = '' } = req.query;
        const result = await ventaService.getAll(page, limit, dia, fechaMin, fechaMax);
        result.data = VentaResponseDto.fromModel(result.data);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
