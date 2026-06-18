const whatsappService = require('../services/whatsappService');

/**
 * Obtener el estado de la conexión de WhatsApp
 * GET /whatsapp/status
 */
exports.getStatus = (req, res) => {
    try {
        const statusData = whatsappService.getStatus();
        res.json(statusData);
    } catch (error) {
        console.error('Error al obtener estado de WhatsApp:', error);
        res.status(500).json({ message: error.message, error: error.message });
    }
};

/**
 * Enviar un documento PDF por WhatsApp
 * POST /whatsapp/send-pdf
 */
exports.sendPdf = async (req, res) => {
    try {
        const { number, pdfBase64, filename } = req.body;

        if (!number) {
            return res.status(400).json({ error: 'El número de teléfono es obligatorio.' });
        }
        if (!pdfBase64) {
            return res.status(400).json({ error: 'El archivo PDF en formato Base64 es obligatorio.' });
        }
        if (!filename) {
            return res.status(400).json({ error: 'El nombre del archivo es obligatorio.' });
        }

        const result = await whatsappService.sendPDF(number, pdfBase64, filename);
        res.json({ success: true, mensaje: 'PDF enviado con éxito.', result });
    } catch (error) {
        console.error('Error al enviar PDF por WhatsApp:', error);
        res.status(500).json({ message: error.message, error: error.message });
    }
};

/**
 * Cerrar la sesión de WhatsApp y forzar un nuevo código QR
 * POST /whatsapp/logout
 */
exports.logout = async (req, res) => {
    try {
        const result = await whatsappService.logout();
        res.json({ success: true, mensaje: 'Sesión cerrada con éxito y datos limpiados.', result });
    } catch (error) {
        console.error('Error al cerrar sesión de WhatsApp:', error);
        res.status(500).json({ message: error.message, error: error.message });
    }
};
