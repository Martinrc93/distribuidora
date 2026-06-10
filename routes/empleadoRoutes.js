const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController.js');

router.get('/', empleadoController.getAll);
router.get('/:id', empleadoController.getById);
router.post('/', empleadoController.create);
router.put('/:id', empleadoController.update);
router.delete('/:id', empleadoController.deleteEmpleado);

module.exports = router;
