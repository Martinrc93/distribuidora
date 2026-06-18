const express = require('express');
const router = express.Router();
const marcaController = require('../controllers/marcaController.js');

router.get('/', marcaController.getAll);
router.get('/all', marcaController.getAllWithoutPagination);
router.get('/:id', marcaController.getById);
router.post('/', marcaController.create);
router.put('/:id', marcaController.update);
router.delete('/:id', marcaController.deleteMarca);

module.exports = router;
