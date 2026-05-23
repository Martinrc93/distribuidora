const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController.js');

// Buscar precios por productId
router.get('/product/:productId', priceController.findByProductId);

// Crear precio (recibe precio y productId en body)
router.post('/', priceController.create);

// Actualizar precio por su ID único
router.put('/:id', priceController.update);

// Eliminar precio por su ID único
router.delete('/:id', priceController.deletePrice);

module.exports = router;
