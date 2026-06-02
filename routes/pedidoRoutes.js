const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidoController.js');

// Mapeo estricto de rutas a controladores para el módulo de Pedidos

router.post('/', pedidoController.registrarPedido);
router.get('/', pedidoController.obtenerPedidos);
router.get('/del-dia', pedidoController.getPedidosDelDia);

module.exports = router;