const express = require('express');
const router = express.Router();
const marcaController = require('../controllers/marcaController.js');
const validateParams = require('../middleware/validateParams.js');

router.get('/', marcaController.getAll);
router.get('/all', marcaController.getAllWithoutPagination);
router.get('/:id', validateParams(['id']), marcaController.getById);
router.post('/', marcaController.create);
router.put('/:id', validateParams(['id']), marcaController.update);
router.delete('/:id', validateParams(['id']), marcaController.deleteMarca);

module.exports = router;
