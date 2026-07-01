import { apiClient } from '../../api/apiClient.js';
import { showToast } from '../../utils/ui.js';

let lastQrString = null;
let pollingInterval = null;
let isDisconnecting = false;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el estado de WhatsApp y comenzar polling
    checkWhatsAppStatus();
    pollingInterval = setInterval(checkWhatsAppStatus, 3000);

    // Configurar listener para cerrar sesión
    const btnDisconnect = document.getElementById('btnDisconnect');
    if (btnDisconnect) {
        btnDisconnect.addEventListener('click', handleDisconnect);
    }

    // Configurar listener para recargar la página
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => {
            window.location.reload();
        });
    }

    // Limpiar intervalo al salir o recargar la ventana
    window.addEventListener('beforeunload', () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    });
});

/**
 * Consulta el estado del servicio de WhatsApp en el backend y actualiza la interfaz
 */
async function checkWhatsAppStatus() {
    // Si el elemento no existe en el DOM, es porque el usuario navegó a otra pestaña.
    // Limpiamos el intervalo para evitar memory leaks en la SPA.
    if (!document.getElementById('whatsappStatusBadge')) {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
        return;
    }

    try {
        const data = await apiClient.get('/whatsapp/status');
        updateUI(data.status, data.qrCodeData);
    } catch (error) {
        console.error('Error al verificar el estado de WhatsApp:', error);
        updateUI('ERROR', null);
    }
}

/**
 * Actualiza la UI según el estado recibido del backend
 */
function updateUI(status, qrCodeData) {
    const badge = document.getElementById('whatsappStatusBadge');
    const text = document.getElementById('statusText');
    const spinner = document.getElementById('statusSpinner');
    
    const qrSection = document.getElementById('qrSection');
    const connectedSection = document.getElementById('connectedSection');
    const initializingSection = document.getElementById('initializingSection');
    const btnDisconnect = document.getElementById('btnDisconnect');

    // Limpiar clases previas del badge
    badge.className = 'status-badge';
    spinner.classList.add('d-none');

    // Ocultar todas las secciones dinámicas inicialmente
    qrSection.classList.add('d-none');
    connectedSection.classList.add('d-none');
    initializingSection.classList.add('d-none');

    // Habilitar el botón siempre (excepto en estado ERROR o si está en pleno cierre)
    if (btnDisconnect) {
        btnDisconnect.disabled = (status === 'ERROR' || isDisconnecting);
    }

    switch (status) {
        case 'CONNECTED':
            badge.classList.add('status-connected');
            text.innerText = 'CONECTADO';
            connectedSection.classList.remove('d-none');
            // Resetear el QR por si acaso
            lastQrString = null;
            break;

        case 'QR_READY':
            badge.classList.add('status-qr');
            text.innerText = 'ESPERANDO ESCANEO';
            qrSection.classList.remove('d-none');
            
            // Solo regenerar el QR si cambió el string
            if (qrCodeData && qrCodeData !== lastQrString) {
                lastQrString = qrCodeData;
                const qrContainer = document.getElementById('qrcode');
                qrContainer.innerHTML = '';
                new QRCode(qrContainer, {
                    text: qrCodeData,
                    width: 256,
                    height: 256,
                    colorDark: '#0b111c',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            }
            break;

        case 'INITIALIZING':
            badge.classList.add('status-initializing');
            text.innerText = 'INICIALIZANDO';
            spinner.classList.remove('d-none');
            initializingSection.classList.remove('d-none');
            lastQrString = null;
            break;

        case 'DISCONNECTED':
            badge.classList.add('status-disconnected');
            text.innerText = 'DESCONECTADO';
            initializingSection.classList.remove('d-none'); // Muestra inicializando porque el backend intentará levantarlo
            lastQrString = null;
            break;

        default:
            badge.classList.add('status-disconnected');
            text.innerText = 'ERROR DE SERVIDOR';
            lastQrString = null;
    }
}

/**
 * Cierra la sesión activa en el backend
 */
async function handleDisconnect() {
    const btnDisconnect = document.getElementById('btnDisconnect');
    if (!btnDisconnect || btnDisconnect.disabled || isDisconnecting) return;

    isDisconnecting = true;
    btnDisconnect.disabled = true;
    btnDisconnect.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Cerrando sesión...';

    try {
        await apiClient.post('/whatsapp/logout');
        showToast('Sesión de WhatsApp cerrada correctamente.', 'success');
        lastQrString = null;
    } catch (error) {
        showToast('Error al cerrar la sesión de WhatsApp: ' + error.message, 'error');
    } finally {
        isDisconnecting = false;
        if (btnDisconnect) {
            btnDisconnect.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i> Cerrar Sesión / Restablecer';
            btnDisconnect.disabled = false;
        }
        await checkWhatsAppStatus();
    }
}


