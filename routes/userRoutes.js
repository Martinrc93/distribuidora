const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const validateParams = require('../middleware/validateParams.js');

router.get('/all', userController.obtenerTodos);
router.get('/:id', validateParams(['id']), userController.obtenerUsuario);
router.post('/', userController.guardarUsuario);

module.exports = router;