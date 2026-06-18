import { apiClient } from '../../api/apiClient.js';

let lastQrString = null;
let pollingInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar el estado de WhatsApp y comenzar polling
    checkWhatsAppStatus();
    pollingInterval = setInterval(checkWhatsAppStatus, 3000);

    // Configurar listener para cerrar sesión
    const btnDisconnect = document.getElementById('btnDisconnect');
    if (btnDisconnect) {
        btnDisconnect.addEventListener('click', handleDisconnect);
    }
});

/**
 * Consulta el estado del servicio de WhatsApp en el backend y actualiza la interfaz
 */
async function checkWhatsAppStatus() {
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

    // Limpiar clases previas del badge
    badge.className = 'status-badge';
    spinner.classList.add('d-none');

    // Ocultar todas las secciones dinámicas inicialmente
    qrSection.classList.add('d-none');
    connectedSection.classList.add('d-none');
    initializingSection.classList.add('d-none');

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
    btnDisconnect.disabled = true;
    btnDisconnect.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Cerrando sesión...';

    try {
        await apiClient.post('/whatsapp/logout');
        showToast('Sesión de WhatsApp cerrada correctamente.', 'success');
        lastQrString = null;
        checkWhatsAppStatus();
    } catch (error) {
        showToast('Error al cerrar la sesión de WhatsApp: ' + error.message, 'error');
    } finally {
        btnDisconnect.disabled = false;
        btnDisconnect.innerHTML = '<i class="fas fa-sign-out-alt me-1"></i> Cerrar Sesión de WhatsApp';
    }
}

/**
 * Muestra una notificación toast elegante y autodescartable
 */
function showToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast ${tipo}`;
    
    const iconHtml = tipo === 'error' 
        ? '<i class="fas fa-times-circle"></i>' 
        : '<i class="fas fa-check-circle"></i>';

    toast.innerHTML = `
        <div class="custom-toast-icon">
            ${iconHtml}
        </div>
        <div class="custom-toast-content">${mensaje}</div>
        <button type="button" class="custom-toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);
    toast.offsetHeight; // force reflow
    toast.classList.add('show');

    const closeToast = () => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    };

    const closeBtn = toast.querySelector('.custom-toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeToast);
    }

    setTimeout(closeToast, 3000);
}
