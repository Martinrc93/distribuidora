const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

/**
 * Detects an installed Chromium browser on the system (Chrome or Edge).
 *
 * In a packaged Electron app, Puppeteer cannot find its downloaded Chrome
 * (it lives in ~/.cache/puppeteer/ which is not included in the build),
 * so we use the system's Chrome or Edge as a fallback.
 * In development, returns undefined so Puppeteer uses its own Chrome.
 */
function detectSystemBrowser() {
    let isPackaged = false;
    try {
        if (process.versions && process.versions.electron) {
            isPackaged = require('electron').app.isPackaged;
        }
    } catch (_) {
        // Not running inside Electron — no need to look for a system browser
    }

    if (!isPackaged) {
        return undefined;
    }

    const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
    const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
    const localAppData = process.env.LOCALAPPDATA || '';

    const candidates = [
        // Google Chrome
        path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        // Microsoft Edge (pre-installed on Windows 10/11)
        path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    ];

    for (const browserPath of candidates) {
        if (browserPath && fs.existsSync(browserPath)) {
            console.log(`[WhatsApp] System browser detected: ${browserPath}`);
            return browserPath;
        }
    }

    console.error(
        '[WhatsApp] No Chrome or Edge found on the system. ' +
        'WhatsApp requires a Chromium browser to work. ' +
        'Please install Google Chrome or Microsoft Edge.'
    );
    return undefined;
}

/**
 * Cleans up stale Chromium lock files left behind by ungraceful crashes.
 */
function cleanStaleLockFiles(authPath, clientId) {
    const resolvedAuthPath = authPath || process.env.WHATSAPP_AUTH_PATH || './';
    const sessionDir = path.join(resolvedAuthPath, `session-${clientId}`);
    const targets = [
        sessionDir,
        path.join(sessionDir, 'Default')
    ];
    const filesToClean = ['lockfile', 'DevToolsActivePort', 'SingletonLock', 'SingletonCookie', 'SingletonSocket'];
    for (const targetDir of targets) {
        if (!fs.existsSync(targetDir)) continue;
        for (const file of filesToClean) {
            const filePath = path.join(targetDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`[WhatsApp] Cleaned stale lock file: ${filePath}`);
                } catch (e) {
                    // Ignore error if file cannot be unlinked
                }
            }
        }
    }
}

/**
 * Creates and returns a configured whatsapp-web.js Client instance.
 *
 * @param {object} options
 * @param {string} options.clientId   - LocalAuth session identifier
 * @param {string} options.authPath   - Directory to persist session data (Electron userData in production)
 * @returns {Client}
 */
function createWhatsAppClient({ clientId = 'distribuidora-session', authPath } = {}) {
    cleanStaleLockFiles(authPath, clientId);
    const executablePath = detectSystemBrowser();

    return new Client({
        authStrategy: new LocalAuth({
            clientId,
            dataPath: authPath || process.env.WHATSAPP_AUTH_PATH || './'
        }),
        puppeteer: {
            headless: true,
            executablePath,
            protocolTimeout: 90000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--metrics-recording-only',
                '--no-first-run',
                '--safebrowsing-disable-auto-update',
                '--disable-features=TranslateUI',
                '--disable-component-update',
                '--window-position=-2400,-2400',
                '--window-size=1,1',
                '--no-default-browser-check'
            ]
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html'
        }
    });
}

module.exports = { createWhatsAppClient };
