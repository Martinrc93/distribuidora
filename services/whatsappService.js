const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

let client = null;
let status = 'DISCONNECTED'; // 'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'CONNECTED'
let qrCodeData = null;

/**
 * Inicializa el cliente de WhatsApp
 */
function initWhatsApp() {
    console.log('Iniciando cliente de WhatsApp...');
    status = 'INITIALIZING';
    qrCodeData = null;

    client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'distribuidora-session',
            dataPath: process.env.WHATSAPP_AUTH_PATH || './'
        }),
        puppeteer: {
            headless: true,
            protocolTimeout: 90000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', (qr) => {
        status = 'QR_READY';
        qrCodeData = qr;
        console.log('Código QR de WhatsApp generado. Escanéalo para conectar:');
        qrcodeTerminal.generate(qr, { small: true });
    });

    client.on('ready', () => {
        status = 'CONNECTED';
        qrCodeData = null;
        console.log('¡Cliente de WhatsApp listo y conectado!');
    });

    client.on('authenticated', () => {
        console.log('Autenticación de WhatsApp exitosa.');
    });

    client.on('auth_failure', (msg) => {
        status = 'DISCONNECTED';
        qrCodeData = null;
        console.error('Fallo en la autenticación de WhatsApp:', msg);
    });

    client.on('disconnected', async (reason) => {
        status = 'DISCONNECTED';
        qrCodeData = null;
        console.log('Cliente de WhatsApp desconectado:', reason);
        // Intentar volver a inicializar después de unos segundos
        try {
            await client.destroy();
        } catch (e) {
            console.error('Error al destruir el cliente de WhatsApp:', e);
        }
        setTimeout(() => {
            initWhatsApp();
        }, 10000);
    });

    client.initialize().catch(err => {
        console.error('Error al inicializar cliente de WhatsApp:', err);
        status = 'DISCONNECTED';
    });
}

/**
 * Retorna el estado actual de la sesión y el string del QR si está disponible
 */
function getStatus() {
    return {
        status,
        qrCodeData
    };
}

/**
 * Envía un archivo PDF codificado en Base64 a un número específico
 * @param {string} number Número telefónico de destino
 * @param {string} pdfBase64 Archivo PDF codificado en Base64 (sin prefijo data:application/pdf;base64,)
 * @param {string} filename Nombre del archivo
 */
async function sendPDF(number, pdfBase64, filename) {
    if (status !== 'CONNECTED' || !client) {
        throw new Error('WhatsApp no está conectado. Por favor, iniciá sesión primero.');
    }

    // Limpiar todos los caracteres no numéricos
    let cleanedNumber = number.replace(/\D/g, '');
    
    // Formateo inteligente para números de Argentina
    // Si tiene 10 dígitos (ej: 1150222520), asumimos que es número móvil de Argentina sin código de país
    if (cleanedNumber.length === 10) {
        cleanedNumber = '549' + cleanedNumber;
    } 
    // Si tiene 12 dígitos y empieza con 54 (ej: 541150222520), le agregamos el 9 de móvil de WhatsApp
    else if (cleanedNumber.length === 12 && cleanedNumber.startsWith('54')) {
        cleanedNumber = '549' + cleanedNumber.slice(2);
    }

    // Asegurar que termine en @c.us
    if (!cleanedNumber.endsWith('@c.us')) {
        cleanedNumber = `${cleanedNumber}@c.us`;
    }

    // Obtener el ID correcto y validado por WhatsApp
    let resolvedJid = cleanedNumber;
    try {
        console.log(`Buscando ID de WhatsApp registrado para: ${cleanedNumber}`);
        const numberId = await client.getNumberId(cleanedNumber);
        if (numberId) {
            resolvedJid = numberId._serialized;
            console.log(`ID de WhatsApp resuelto con éxito: ${resolvedJid}`);
        } else {
            // Si getNumberId no encuentra el número con el formato inicial (ej: con 9),
            // y es de Argentina (empieza con 549), intentamos sin el '9' por si estuviera registrado así.
            if (cleanedNumber.startsWith('549')) {
                const alternativeLookup = '54' + cleanedNumber.slice(3);
                console.log(`No registrado con 549. Probando formato alternativo: ${alternativeLookup}`);
                const altNumberId = await client.getNumberId(alternativeLookup);
                if (altNumberId) {
                    resolvedJid = altNumberId._serialized;
                    console.log(`ID de WhatsApp resuelto en formato alternativo: ${resolvedJid}`);
                } else {
                    throw new Error('El número no está registrado en WhatsApp.');
                }
            } else {
                throw new Error('El número no está registrado en WhatsApp.');
            }
        }
    } catch (err) {
        console.error(`Error al verificar registro del número:`, err);
        throw new Error(err.message || 'El número no está registrado en WhatsApp o no se pudo verificar.');
    }

    console.log(`Enviando PDF a: ${resolvedJid}`);

    try {
        const media = new MessageMedia('application/pdf', pdfBase64, filename);
        await client.sendMessage(resolvedJid, media);
        console.log(`PDF enviado con éxito a ${resolvedJid}`);
        return { success: true };
    } catch (error) {
        console.error('Error al enviar mensaje de WhatsApp:', error);
        throw error;
    }
}

/**
 * Cierra la sesión activa de WhatsApp y limpia los archivos locales de autenticación
 */
async function logout() {
    if (!client) {
        const sessionPath = path.join(process.env.WHATSAPP_AUTH_PATH || './', 'session-distribuidora-session');
        if (fs.existsSync(sessionPath)) {
            try {
                fs.rmSync(sessionPath, { recursive: true, force: true });
                console.log('Carpeta de sesión eliminada manualmente (sin cliente).');
            } catch (rmErr) {
                console.error('Error al eliminar la carpeta de sesión:', rmErr);
            }
        }
        initWhatsApp();
        return { success: true };
    }

    try {
        status = 'DISCONNECTED';
        qrCodeData = null;
        try {
            await client.logout();
        } catch (e) {
            console.log('No se pudo desvincular de los servidores de WhatsApp:', e.message);
            const sessionPath = path.join(process.env.WHATSAPP_AUTH_PATH || './', 'session-distribuidora-session');
            if (fs.existsSync(sessionPath)) {
                try {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                    console.log('Carpeta de sesión eliminada manualmente.');
                } catch (rmErr) {
                    console.error('Error al eliminar la carpeta de sesión manualmente:', rmErr);
                }
            }
        }
        try {
            await client.destroy();
        } catch (e) {
            console.log('Error al destruir el cliente de WhatsApp:', e.message);
        }
        
        // Inicializar de nuevo para generar un nuevo QR
        initWhatsApp();
        return { success: true };
    } catch (error) {
        console.error('Error durante el logout de WhatsApp:', error);
        throw error;
    }
}

/**
 * Cierra la sesión de WhatsApp de forma definitiva y destruye el cliente antes de salir
 */
async function logoutAndDestroy() {
    if (!client) return;
    try {
        console.log('Cerrando sesión de WhatsApp y destruyendo cliente...');
        const currentStatus = status;
        status = 'DISCONNECTED';
        qrCodeData = null;
        if (currentStatus === 'CONNECTED') {
            await client.logout();
        }
        await client.destroy();
        console.log('Cliente de WhatsApp destruido con éxito.');
    } catch (error) {
        console.error('Error durante el cierre de sesión de WhatsApp al salir:', error);
    }
}

module.exports = {
    initWhatsApp,
    getStatus,
    sendPDF,
    logout,
    logoutAndDestroy
};
