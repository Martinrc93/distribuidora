const { MessageMedia } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { createWhatsAppClient } = require('../config/whatsappClient');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATES = {
    DISCONNECTED: 'DISCONNECTED',
    INITIALIZING: 'INITIALIZING',
    QR_READY: 'QR_READY',
    CONNECTED: 'CONNECTED'
};

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 10_000;
const CLIENT_ID = 'distribuidora-session';

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let client = null;
let status = STATES.DISCONNECTED;
let qrCodeData = null;
let isExplicitLogout = false;
let connectionRetries = 0;

// ---------------------------------------------------------------------------
// Structured logging  (doc Section 12.6)
// ---------------------------------------------------------------------------

function logInfo(message) {
    console.log(`[WhatsApp] ${message}`);
}

function logError(message, error) {
    console.error(`[WhatsApp] ${message}`, error || '');
}

// ---------------------------------------------------------------------------
// Session folder helper
// ---------------------------------------------------------------------------

/**
 * Resolves the path to the LocalAuth session folder and removes it if it exists.
 * Used during explicit logout and error-recovery flows.
 */
function cleanSessionFolder() {
    const sessionPath = path.join(
        process.env.WHATSAPP_AUTH_PATH || './',
        `session-${CLIENT_ID}`
    );

    if (!fs.existsSync(sessionPath)) return;

    try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        logInfo('Session folder deleted.');
    } catch (err) {
        logError('Failed to delete session folder:', err);
    }
}

// ---------------------------------------------------------------------------
// Client event registration  (doc Section 6)
// ---------------------------------------------------------------------------

/**
 * Registers all lifecycle events on the given client instance.
 */
function registerClientEvents(whatsappClient) {
    whatsappClient.on('qr', (qr) => {
        status = STATES.QR_READY;
        qrCodeData = qr;
        logInfo('QR code generated. Scan it with WhatsApp to connect.');
        qrcodeTerminal.generate(qr, { small: true });
    });

    whatsappClient.on('ready', () => {
        status = STATES.CONNECTED;
        qrCodeData = null;
        connectionRetries = 0;
        logInfo('Client ready and connected.');
    });

    whatsappClient.on('authenticated', () => {
        logInfo('Authentication successful.');
    });

    whatsappClient.on('auth_failure', (msg) => {
        status = STATES.DISCONNECTED;
        qrCodeData = null;
        logError('Authentication failed:', msg);
    });

    whatsappClient.on('disconnected', async (reason) => {
        status = STATES.DISCONNECTED;
        qrCodeData = null;
        logInfo(`Client disconnected: ${reason}`);

        if (isExplicitLogout) {
            logInfo('Explicit logout — will not attempt reconnection.');
            return;
        }

        try {
            await whatsappClient.destroy();
        } catch (e) {
            logError('Error destroying client after disconnect:', e);
        }

        if (connectionRetries < MAX_RETRIES) {
            connectionRetries++;
            logInfo(`Reconnection attempt ${connectionRetries}/${MAX_RETRIES} in ${RETRY_DELAY_MS / 1000}s...`);
            setTimeout(() => {
                if (!isExplicitLogout) {
                    initWhatsApp(true);
                }
            }, RETRY_DELAY_MS);
        } else {
            logError(`Max reconnection attempts reached (${MAX_RETRIES}). Stopping auto-reconnect.`);
        }
    });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initializes the WhatsApp client.
 * @param {boolean} isAutoReconnect — true when called by the reconnect loop
 */
function initWhatsApp(isAutoReconnect = false) {
    if (!isAutoReconnect) {
        connectionRetries = 0;
    }

    logInfo('Initializing client...');
    status = STATES.INITIALIZING;
    qrCodeData = null;

    client = createWhatsAppClient({ clientId: CLIENT_ID });

    registerClientEvents(client);

    client.initialize().catch(err => {
        logError('Initialization failed:', err);
        status = STATES.DISCONNECTED;
    });
}

/**
 * Returns the current session status and QR data (if available).
 */
function getStatus() {
    return { status, qrCodeData };
}

/**
 * Sends a Base64-encoded PDF file to a phone number via WhatsApp.
 *
 * @param {string} number    — Destination phone number
 * @param {string} pdfBase64 — PDF file encoded in Base64 (no data-URI prefix)
 * @param {string} filename  — Display name for the file
 */
async function sendPDF(number, pdfBase64, filename) {
    if (status !== STATES.CONNECTED || !client) {
        throw new Error('WhatsApp no está conectado. Por favor, iniciá sesión primero.');
    }

    // Strip all non-numeric characters
    let cleanedNumber = number.replace(/\D/g, '');

    // Smart formatting for Argentine mobile numbers
    if (cleanedNumber.length === 10) {
        // 10 digits (e.g. 1150222520) → prepend country code + mobile prefix
        cleanedNumber = '549' + cleanedNumber;
    } else if (cleanedNumber.length === 12 && cleanedNumber.startsWith('54')) {
        // 12 digits starting with 54 (e.g. 541150222520) → insert mobile "9"
        cleanedNumber = '549' + cleanedNumber.slice(2);
    }

    // Ensure WhatsApp chat ID suffix
    if (!cleanedNumber.endsWith('@c.us')) {
        cleanedNumber = `${cleanedNumber}@c.us`;
    }

    // Resolve the registered WhatsApp ID
    let resolvedJid = cleanedNumber;
    try {
        logInfo(`Looking up registered WhatsApp ID for: ${cleanedNumber}`);
        const numberId = await client.getNumberId(cleanedNumber);

        if (numberId) {
            resolvedJid = numberId._serialized;
            logInfo(`WhatsApp ID resolved: ${resolvedJid}`);
        } else if (cleanedNumber.startsWith('549')) {
            // Fallback: try without the mobile "9" (some numbers are registered that way)
            const altLookup = '54' + cleanedNumber.slice(3);
            logInfo(`Not found with 549 prefix. Trying alternative: ${altLookup}`);
            const altNumberId = await client.getNumberId(altLookup);

            if (altNumberId) {
                resolvedJid = altNumberId._serialized;
                logInfo(`WhatsApp ID resolved (alternative): ${resolvedJid}`);
            } else {
                throw new Error('El número no está registrado en WhatsApp.');
            }
        } else {
            throw new Error('El número no está registrado en WhatsApp.');
        }
    } catch (err) {
        logError('Number verification failed:', err);
        throw new Error(err.message || 'El número no está registrado en WhatsApp o no se pudo verificar.');
    }

    logInfo(`Sending PDF to: ${resolvedJid}`);

    try {
        const media = new MessageMedia('application/pdf', pdfBase64, filename);
        await client.sendMessage(resolvedJid, media);
        logInfo(`PDF sent successfully to ${resolvedJid}`);
        return { success: true };
    } catch (error) {
        logError('Failed to send WhatsApp message:', error);
        throw error;
    }
}

/**
 * Logs out the active WhatsApp session, cleans local auth data,
 * and re-initializes the client so a new QR code is generated.
 */
async function logout() {
    isExplicitLogout = true;

    if (!client) {
        cleanSessionFolder();
        isExplicitLogout = false;
        initWhatsApp();
        return { success: true };
    }

    try {
        status = STATES.DISCONNECTED;
        qrCodeData = null;

        try {
            await client.logout();
        } catch (e) {
            logInfo(`Could not unlink from WhatsApp servers: ${e.message}`);
            cleanSessionFolder();
        }

        try {
            await client.destroy();
        } catch (e) {
            logInfo(`Error destroying client during logout: ${e.message}`);
        }

        isExplicitLogout = false;
        initWhatsApp();
        return { success: true };
    } catch (error) {
        isExplicitLogout = false;
        logError('Logout failed:', error);
        throw error;
    }
}

/**
 * Destroys the WhatsApp client cleanly before the Electron app exits.
 * Does NOT call client.logout() — the session is preserved so the user
 * does not need to re-scan the QR code on the next launch.
 */
async function logoutAndDestroy() {
    isExplicitLogout = true;
    if (!client) return;

    try {
        logInfo('Shutting down client and releasing resources...');
        status = STATES.DISCONNECTED;
        qrCodeData = null;
        await client.destroy();
        logInfo('Client destroyed successfully.');
    } catch (error) {
        logError('Error destroying client on exit:', error);
    }
}

module.exports = {
    initWhatsApp,
    getStatus,
    sendPDF,
    logout,
    logoutAndDestroy
};
