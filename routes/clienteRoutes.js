const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController.js');
const ventaController = require('../controllers/ventaController.js');
const validateParams = require('../middleware/validateParams.js');

router.get('/', clienteController.getAll);
router.get('/:id', validateParams(['id']), clienteController.getById);
router.get('/:id/ultima-venta', validateParams(['id']), ventaController.getUltimaVentaByCliente);
router.post('/', clienteController.create);
router.put('/:id', validateParams(['id']), clienteController.update);
router.delete('/:id', validateParams(['id']), clienteController.deleteCliente);

module.exports = router;
