const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');

/**
 * @swagger
 * tags:
 *   name: Configuraciones
 *   description: API para gestionar configuraciones del sistema
 */

/**
 * @swagger
 * /api/configuraciones:
 *   get:
 *     summary: Obtiene todas las configuraciones
 *     tags: [Configuraciones]
 *     responses:
 *       200:
 *         description: Lista de configuraciones en formato clave-valor
 */
router.get('/', configuracionController.getAll);

/**
 * @swagger
 * /api/configuraciones/bulk:
 *   put:
 *     summary: Actualiza multiples configuraciones
 *     tags: [Configuraciones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: string
 *     responses:
 *       200:
 *         description: Configuraciones actualizadas correctamente
 */
router.put('/bulk', configuracionController.updateBulk);

module.exports = router;
