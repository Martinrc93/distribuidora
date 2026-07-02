const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController.js');
const validateParams = require('../middleware/validateParams.js');

// Obtener todas las ventas activas de un empleado
router.get('/empleado/:empleadoId', validateParams(['empleadoId']), ventaController.getByEmpleado);

// Obtener todas las ventas activas de un cliente con paginación y filtros de fecha
router.get('/cliente/:clienteId', validateParams(['clienteId']), ventaController.getVentasByCliente);

// Obtener el último pedido activo de un cliente
router.get('/ultimo/:clienteId', validateParams(['clienteId']), ventaController.getUltimaVentaByCliente);

// Obtener todas las ventas con paginación
router.get('/', ventaController.getAll);

// Registrar una nueva venta completa
router.post('/', ventaController.create);

// Actualizar el estado activo/inactivo (active) de una venta
router.put('/:id', validateParams(['id']), ventaController.updateStatus);

// Actualizar el orden de impresión de una venta
router.patch('/:id/orden-impresion', validateParams(['id']), ventaController.updateOrdenImpresion);

// Intercambiar orden de impresión entre dos ventas
router.patch('/orden-impresion/swap', ventaController.swapOrdenImpresion);

module.exports = router;
