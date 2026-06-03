const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController.js');
const ventaController = require('../controllers/ventaController.js');

router.get('/', clienteController.getAll);
router.get('/:id', clienteController.getById);
router.get('/:id/ultima-venta', ventaController.getUltimaVentaByCliente);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
router.delete('/:id', clienteController.deleteCliente);

module.exports = router;
