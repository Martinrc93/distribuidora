const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController.js');
const validateParams = require('../middleware/validateParams.js');

router.get('/', productController.getAll);
router.get('/all', productController.getAllWithoutPagination);
router.get('/:id', validateParams(['id']), productController.getById);
router.post('/', productController.create);
router.put('/:id', validateParams(['id']), productController.update);
router.delete('/:id', validateParams(['id']), productController.deleteProduct);

module.exports = router;
