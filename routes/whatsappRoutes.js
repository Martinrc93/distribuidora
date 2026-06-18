const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Obtener estado de la conexión
router.get('/status', whatsappController.getStatus);

// Enviar un PDF
router.post('/send-pdf', whatsappController.sendPdf);

// Cerrar sesión
router.post('/logout', whatsappController.logout);

module.exports = router;
