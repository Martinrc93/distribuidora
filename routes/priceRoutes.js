const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController.js');
const validateParams = require('../middleware/validateParams.js');

// Buscar precios por productId
router.get('/product/:productoId', validateParams(['productoId']), priceController.findByProductoId);

// Crear precio (recibe precio y productId en body)
router.post('/', priceController.create);

// Actualizar precio por su ID único
router.put('/:id', validateParams(['id']), priceController.update);

// Eliminar precio por su ID único
router.delete('/:id', validateParams(['id']), priceController.deletePrice);

module.exports = router;
