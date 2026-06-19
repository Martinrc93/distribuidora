const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController.js');

// Rutas de estadísticas para los 3 tableros
router.get('/finance', dashboardController.getFinanceStats);
router.get('/portfolio', dashboardController.getPortfolioStats);
router.get('/commercial', dashboardController.getCommercialStats);

module.exports = router;
