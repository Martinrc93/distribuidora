const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController.js');

// Obtener todas las ventas activas de un empleado
router.get('/empleado/:empleadoId', ventaController.getByEmpleado);

// Registrar una nueva venta completa
router.post('/', ventaController.create);

// Actualizar el estado activo/inactivo (active) de una venta
router.put('/:id', ventaController.updateStatus);

module.exports = router;
