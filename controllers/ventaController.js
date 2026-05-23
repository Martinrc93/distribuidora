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
        const { page = 1, limit = 10, dia = '' } = req.query;

        const result = await ventaService.getByEmpleado(empleadoId, page, limit, dia);
        
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
 * Actualizar el estado activo/inactivo (active) de una venta.
 * Ruta: PUT /ventas/:id/status o PUT /ventas/:id
 */
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { active } = req.body;

        // Validación estricta: solo se puede actualizar la propiedad active
        if (active === undefined || typeof active !== 'boolean') {
            return res.status(400).json({ error: 'El campo "active" es obligatorio y debe ser un valor booleano (true/false).' });
        }

        const ventaActualizada = await ventaService.updateStatus(id, active);
        if (!ventaActualizada) {
            return res.status(404).json({ mensaje: 'Venta no encontrada para actualizar' });
        }

        res.json(VentaResponseDto.fromModel(ventaActualizada));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
