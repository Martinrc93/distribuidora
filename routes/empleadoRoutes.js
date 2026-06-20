const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController.js');
const validateParams = require('../middleware/validateParams.js');

router.get('/', empleadoController.getAll);
router.get('/:id', validateParams(['id']), empleadoController.getById);
router.post('/', empleadoController.create);
router.put('/:id', validateParams(['id']), empleadoController.update);
router.delete('/:id', validateParams(['id']), empleadoController.deleteEmpleado);

module.exports = router;
