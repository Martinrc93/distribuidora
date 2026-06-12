const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController.js');

// Obtener todas las ventas activas de un empleado
router.get('/empleado/:empleadoId', ventaController.getByEmpleado);

// Obtener todas las ventas activas de un cliente con paginación y filtros de fecha
router.get('/cliente/:clienteId', ventaController.getVentasByCliente);

// Obtener todas las ventas con paginación
router.get('/', ventaController.getAll);

// Registrar una nueva venta completa
router.post('/', ventaController.create);

// Actualizar el estado activo/inactivo (active) de una venta
router.put('/:id', ventaController.updateStatus);

module.exports = router;
