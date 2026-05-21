const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');

router.get('/all', userController.obtenerTodos);
router.get('/:id', userController.obtenerUsuario);
router.post('/', userController.guardarUsuario);

module.exports = router;