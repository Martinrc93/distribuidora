// configuraciones.js
import { showToast } from '../../utils/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById('configForm');
    
    // Inputs
    const inputNombreComercio = document.getElementById('nombre_negocio');
    const inputInfoContacto = document.getElementById('info_contacto');

    // Valores por defecto
    inputNombreComercio.value = 'Distri-Pipipuch';
    inputInfoContacto.value = 'LORENA 1150222520 - DANIEL 1150222413';

    // Cargar configuraciones actuales
    const loadConfig = async () => {
        try {
            const response = await fetch('/configuraciones');
            if (response.ok) {
                const config = await response.json();
                if (config.nombre_negocio) inputNombreComercio.value = config.nombre_negocio;
                if (config.info_contacto) inputInfoContacto.value = config.info_contacto;
            } else {
                console.warn('Ruta /configuraciones no responde. ¿Se reinició el backend?');
            }
        } catch (error) {
            console.error('Error fetching configurations:', error);
        }
    };

    // Guardar configuraciones
    configForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = configForm.querySelector('button[type="submit"]');

        const updates = {
            nombre_negocio: inputNombreComercio.value,
            info_contacto: inputInfoContacto.value
        };

        try {
            if (submitBtn) submitBtn.disabled = true;
            const response = await fetch('/configuraciones/bulk', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                showToast('Configuraciones guardadas correctamente', 'success');
            } else {
                showToast('Error al guardar configuraciones', 'danger');
            }
        } catch (error) {
            console.error('Error saving configurations:', error);
            showToast('Error de conexión', 'danger');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // Configuración del sistema de actualizaciones
    const installedVersionEl = document.getElementById('installedVersion');
    const availableVersionEl = document.getElementById('availableVersion');
    const updateStatusTextEl = document.getElementById('updateStatusText');
    const downloadProgressContainer = document.getElementById('downloadProgressContainer');
    const downloadProgressBar = document.getElementById('downloadProgressBar');
    const downloadProgressText = document.getElementById('downloadProgressText');
    const downloadProgressBytes = document.getElementById('downloadProgressBytes');
    const releaseNotesContainer = document.getElementById('releaseNotesContainer');
    const releaseNotesContent = document.getElementById('releaseNotesContent');

    const btnCheckUpdates = document.getElementById('btnCheckUpdates');
    const btnDownloadUpdate = document.getElementById('btnDownloadUpdate');
    const btnInstallUpdate = document.getElementById('btnInstallUpdate');

    if (window.updates) {
        // Cargar versión instalada
        window.updates.getVersion().then(version => {
            if (installedVersionEl) installedVersionEl.textContent = `v${version}`;
        }).catch(err => console.error('Error al obtener versión:', err));

        // Cargar resultado de actualización anterior si la hay
        window.updates.getStatus().then(status => {
            if (status.lastResult === 'success') {
                showToast(`¡Sistema actualizado con éxito a la versión v${status.lastVersion}!`, 'success');
            } else if (status.lastResult === 'failed') {
                showToast(`La actualización a v${status.lastVersion} falló. Se restauró el backup automático por seguridad.`, 'danger');
            }
        }).catch(err => console.error('Error al obtener resultado de actualización:', err));

        // Escuchar cambios de estado
        window.updates.onStatus((data) => {
            console.log('Update status update:', data);
            
            // Reestablecer estados por defecto de botones
            btnCheckUpdates.classList.remove('d-none');
            btnDownloadUpdate.classList.add('d-none');
            btnInstallUpdate.classList.add('d-none');
            downloadProgressContainer.classList.add('d-none');

            switch (data.status) {
                case 'checking':
                    updateStatusTextEl.className = 'fw-semibold text-info';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Buscando actualizaciones...';
                    btnCheckUpdates.disabled = true;
                    break;

                case 'available':
                    updateStatusTextEl.className = 'fw-semibold text-success';
                    updateStatusTextEl.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i> Nueva versión disponible: v${data.version}`;
                    availableVersionEl.textContent = `v${data.version}`;
                    availableVersionEl.className = 'fw-bold text-success';
                    btnCheckUpdates.disabled = false;
                    btnDownloadUpdate.classList.remove('d-none');
                    
                    if (data.releaseNotes) {
                        releaseNotesContainer.classList.remove('d-none');
                        releaseNotesContent.textContent = data.releaseNotes;
                    }
                    break;

                case 'not-available':
                    updateStatusTextEl.className = 'fw-semibold text-secondary';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-check-circle me-1"></i> Ya tienes la versión más reciente instalada.';
                    availableVersionEl.textContent = 'No hay actualizaciones';
                    availableVersionEl.className = 'fw-bold text-secondary';
                    btnCheckUpdates.disabled = false;
                    break;

                case 'downloading':
                    updateStatusTextEl.className = 'fw-semibold text-warning';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Descargando actualización...';
                    btnCheckUpdates.disabled = true;
                    downloadProgressContainer.classList.remove('d-none');
                    
                    const percent = Math.round(data.percent || 0);
                    downloadProgressBar.style.width = `${percent}%`;
                    downloadProgressBar.setAttribute('aria-valuenow', percent);
                    downloadProgressText.textContent = `${percent}%`;
                    
                    const mbTransferred = (data.transferred / (1024 * 1024)).toFixed(2);
                    const mbTotal = (data.total / (1024 * 1024)).toFixed(2);
                    downloadProgressBytes.textContent = `${mbTransferred} MB / ${mbTotal} MB`;
                    break;

                case 'downloaded':
                    updateStatusTextEl.className = 'fw-semibold text-success';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-file-download me-1"></i> Descarga completa. Listo para instalar.';
                    btnCheckUpdates.disabled = false;
                    btnInstallUpdate.classList.remove('d-none');
                    break;

                case 'preparing':
                    updateStatusTextEl.className = 'fw-semibold text-warning';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Preparando actualización y modo mantenimiento...';
                    btnCheckUpdates.disabled = true;
                    btnInstallUpdate.disabled = true;
                    break;

                case 'backup-running':
                    updateStatusTextEl.className = 'fw-semibold text-warning';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-database me-1"></i> <i class="fas fa-spinner fa-spin me-1"></i> Creando backup seguro de la base de datos...';
                    btnCheckUpdates.disabled = true;
                    btnInstallUpdate.disabled = true;
                    break;

                case 'backup-validating':
                    updateStatusTextEl.className = 'fw-semibold text-warning';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-check-double me-1"></i> <i class="fas fa-spinner fa-spin me-1"></i> Validando integridad del backup...';
                    btnCheckUpdates.disabled = true;
                    btnInstallUpdate.disabled = true;
                    break;

                case 'closing-database':
                    updateStatusTextEl.className = 'fw-semibold text-warning';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-plug me-1"></i> <i class="fas fa-spinner fa-spin me-1"></i> Cerrando conexiones de base de datos...';
                    btnCheckUpdates.disabled = true;
                    btnInstallUpdate.disabled = true;
                    break;

                case 'installing':
                    updateStatusTextEl.className = 'fw-semibold text-success';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Instalando actualización... La aplicación se reiniciará.';
                    btnCheckUpdates.disabled = true;
                    btnInstallUpdate.disabled = true;
                    break;

                case 'completed':
                    updateStatusTextEl.className = 'fw-semibold text-success';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-check-circle me-1"></i> ¡Actualización completada! Reiniciando...';
                    break;

                case 'error':
                    updateStatusTextEl.className = 'fw-semibold text-danger';
                    updateStatusTextEl.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i> Error: ${data.message}`;
                    btnCheckUpdates.disabled = false;
                    btnInstallUpdate.disabled = false;
                    break;
            }
        });

        // Eventos
        btnCheckUpdates.addEventListener('click', () => {
            window.updates.check();
        });

        btnDownloadUpdate.addEventListener('click', () => {
            window.updates.download();
        });

        btnInstallUpdate.addEventListener('click', async () => {
            const confirm = await showCustomConfirm('¿Deseas iniciar la instalación? Se creará un backup y la aplicación se reiniciará automáticamente.');
            if (confirm) {
                window.updates.install();
            }
        });
    } else {
        // Fuera de Electron
        if (updateStatusTextEl) {
            updateStatusTextEl.className = 'fw-semibold text-warning';
            updateStatusTextEl.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Las actualizaciones automáticas no están disponibles en el navegador web.';
        }
        if (btnCheckUpdates) btnCheckUpdates.disabled = true;
    }

    // Iniciar
    loadConfig();
});
