/**
 * Muestra una notificación temporal (Toast) en la pantalla.
 * @param {string} mensaje - El texto o HTML a mostrar.
 * @param {'success' | 'error'} tipo - Tipo de notificación.
 */
export function showToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `custom-toast ${tipo}`;

    const iconHtml = tipo === 'error' 
        ? '<i class="fas fa-exclamation-circle"></i>' 
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

    // Animación de entrada: forzar reflow y agregar la clase 'show'
    toast.offsetHeight; // force reflow
    toast.classList.add('show');

    // Función para cerrar el toast de forma animada
    const closeToast = () => {
        toast.classList.remove('show');
        // Esperar a que termine la transición de salida antes de remover del DOM
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    };

    // Cerrar al hacer clic en el botón de cerrar
    const closeBtn = toast.querySelector('.custom-toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeToast);
    }

    // Auto-descartar después de 3 segundos (3000 ms)
    setTimeout(closeToast, 3000);
}

/**
 * Muestra una ventana modal de confirmación personalizada.
 * @param {string} mensaje - Mensaje a mostrar en la ventana.
 * @returns {Promise<boolean>} Promesa que se resuelve con true si acepta, false si cancela.
 */
export function showCustomConfirm(mensaje) {
    return new Promise((resolve) => {
        // Crear el overlay
        const overlay = document.createElement('div');
        overlay.className = 'custom-confirm-overlay';
        
        overlay.innerHTML = `
            <div class="custom-confirm-box">
                <div class="custom-confirm-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h5>Confirmación</h5>
                </div>
                <div class="custom-confirm-body">
                    <p>${mensaje}</p>
                </div>
                <div class="custom-confirm-footer">
                    <button class="btn btn-secondary btn-confirm-cancel">Cancelar</button>
                    <button class="btn btn-danger btn-confirm-accept">Aceptar</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const btnCancel = overlay.querySelector('.btn-confirm-cancel');
        const btnAccept = overlay.querySelector('.btn-confirm-accept');

        // Forzar reflow y agregar clase 'show' para que se anime la entrada
        overlay.offsetHeight; // force reflow
        overlay.classList.add('show');

        // Foco inicial en el botón de aceptar para facilitar uso rápido con Enter
        btnAccept.focus();

        const close = () => {
            overlay.classList.remove('show');
            window.removeEventListener('keydown', handleKeyDown);
            // Esperar que termine la animación antes de quitar del DOM
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
            });
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                close();
                resolve(false);
            } else if (e.key === 'Enter') {
                close();
                resolve(true);
            }
        };

        // Registrar listener de teclado
        window.addEventListener('keydown', handleKeyDown);

        btnCancel.addEventListener('click', () => {
            close();
            resolve(false);
        });

        btnAccept.addEventListener('click', () => {
            close();
            resolve(true);
        });
    });
}
