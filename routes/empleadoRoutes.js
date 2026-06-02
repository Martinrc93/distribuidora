const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController.js');

router.get('/', empleadoController.getAllEmpleados);
router.post('/', empleadoController.createEmpleado);

module.exports = router;
