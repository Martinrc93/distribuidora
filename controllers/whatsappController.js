const whatsappService = require('../services/whatsappService');

/**
 * Known user-facing error messages from the service layer.
 * These are safe to forward to the frontend as-is.
 */
const KNOWN_USER_MESSAGES = [
    'WhatsApp no está conectado',
    'no está registrado en WhatsApp',
    'no se pudo verificar',
    'experimentando inconvenientes'
];

/**
 * Returns a user-friendly error message. If the original message is a known
 * business-logic error, it is returned unchanged. Otherwise, a generic message
 * is returned to avoid leaking internal/library details to the UI.
 */
function toUserMessage(error) {
    const msg = error.message || '';
    const isKnown = KNOWN_USER_MESSAGES.some(known => msg.includes(known));
    return isKnown ? msg : 'Error desde el servicio de WhatsApp.';
}

/**
 * Obtener el estado de la conexión de WhatsApp
 * GET /whatsapp/status
 */
exports.getStatus = (req, res) => {
    try {
        const statusData = whatsappService.getStatus();
        res.json(statusData);
    } catch (error) {
        console.error('[WhatsApp] Error getting status:', error);
        const message = toUserMessage(error);
        res.status(500).json({ message, error: message });
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
        console.error('[WhatsApp] Error sending PDF:', error);
        const message = toUserMessage(error);
        res.status(500).json({ message, error: message });
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
        console.error('[WhatsApp] Error during logout:', error);
        const message = toUserMessage(error);
        res.status(500).json({ message, error: message });
    }
};
