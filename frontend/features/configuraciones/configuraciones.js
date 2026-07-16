// configuraciones.js
import { showToast, showCustomConfirm } from '../../utils/ui.js';

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
    const updateStatusTextEl = document.getElementById('updateStatusText');
    const downloadProgressContainer = document.getElementById('downloadProgressContainer');
    const downloadProgressBar = document.getElementById('downloadProgressBar');
    const downloadProgressText = document.getElementById('downloadProgressText');
    const downloadProgressBytes = document.getElementById('downloadProgressBytes');
    const btnCheckUpdates = document.getElementById('btnCheckUpdates');

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
        window.updates.onStatus(async (data) => {
            console.log('Update status update:', data);
            
            // Reestablecer estados por defecto
            btnCheckUpdates.classList.remove('d-none');
            downloadProgressContainer.classList.add('d-none');

            switch (data.status) {
                case 'checking':
                    updateStatusTextEl.className = 'fw-semibold text-info mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Buscando actualizaciones...';
                    btnCheckUpdates.disabled = true;
                    break;

                case 'available':
                    updateStatusTextEl.className = 'fw-semibold text-success mt-2';
                    updateStatusTextEl.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i> Nueva versión disponible: v${data.version}`;
                    btnCheckUpdates.disabled = false;
                    
                    // Preguntar si desea actualizar
                    const confirm = await showCustomConfirm(
                        `Hay una nueva versión disponible del sistema (v${data.version}).\n\n` +
                        `¿Querés descargarla y actualizar ahora?\n\n` +
                        `(Nota: La aplicación se cerrará automáticamente para iniciar el actualizador).`
                    );
                    if (confirm) {
                        window.updates.download();
                    } else {
                        updateStatusTextEl.className = 'fw-semibold text-secondary mt-2';
                        updateStatusTextEl.innerHTML = `<i class="fas fa-check-circle me-1"></i> Actualización v${data.version} disponible (instalación pospuesta).`;
                    }
                    break;

                case 'not-available':
                    updateStatusTextEl.className = 'fw-semibold text-secondary mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-check-circle me-1"></i> Ya tienes la versión más reciente instalada.';
                    btnCheckUpdates.disabled = false;
                    break;

                case 'downloading':
                    updateStatusTextEl.className = 'fw-semibold text-warning mt-2';
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
                    updateStatusTextEl.className = 'fw-semibold text-success mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-file-download me-1"></i> Descarga completa. Instalando actualizador...';
                    btnCheckUpdates.disabled = true;
                    
                    // Ejecutar instalación automáticamente ya que el usuario confirmó
                    window.updates.install();
                    break;

                case 'preparing':
                    updateStatusTextEl.className = 'fw-semibold text-warning mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Preparando actualización y modo mantenimiento...';
                    btnCheckUpdates.disabled = true;
                    break;

                case 'backup-running':
                    updateStatusTextEl.className = 'fw-semibold text-warning mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-database me-1"></i> <i class="fas fa-spinner fa-spin me-1"></i> Creando backup seguro de la base de datos...';
                    btnCheckUpdates.disabled = true;
                    break;

                case 'backup-validating':
                    updateStatusTextEl.className = 'fw-semibold text-warning mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-check-double me-1"></i> <i class="fas fa-spinner fa-spin me-1"></i> Validando integridad del backup...';
                    btnCheckUpdates.disabled = true;
                    break;

                case 'closing-database':
                    updateStatusTextEl.className = 'fw-semibold text-warning mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-plug me-1"></i> <i class="fas fa-spinner fa-spin me-1"></i> Cerrando conexiones de base de datos...';
                    btnCheckUpdates.disabled = true;
                    break;

                case 'installing':
                    updateStatusTextEl.className = 'fw-semibold text-success mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Instalando actualización... La aplicación se cerrará.';
                    btnCheckUpdates.disabled = true;
                    break;

                case 'completed':
                    updateStatusTextEl.className = 'fw-semibold text-success mt-2';
                    updateStatusTextEl.innerHTML = '<i class="fas fa-check-circle me-1"></i> ¡Actualización completada! Reiniciando...';
                    break;

                case 'error':
                    updateStatusTextEl.className = 'fw-semibold text-danger mt-2';
                    updateStatusTextEl.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i> Error: ${data.message}`;
                    btnCheckUpdates.disabled = false;
                    break;
            }
        });

        // Eventos
        btnCheckUpdates.addEventListener('click', () => {
            window.updates.check();
        });
    } else {
        // Fuera de Electron
        if (updateStatusTextEl) {
            updateStatusTextEl.className = 'fw-semibold text-warning mt-2';
            updateStatusTextEl.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Las actualizaciones automáticas no están disponibles en el navegador web.';
        }
        if (btnCheckUpdates) btnCheckUpdates.disabled = true;
    }

    // Gestión de Copias de Seguridad de la Base de Datos
    const btnExportDb = document.getElementById('btnExportDb');
    const btnImportDb = document.getElementById('btnImportDb');

    if (window.database) {
        btnExportDb.addEventListener('click', async () => {
            try {
                btnExportDb.disabled = true;
                const result = await window.database.export();
                if (result.success) {
                    showToast('Base de datos exportada con éxito.', 'success');
                } else if (result.message !== 'Operación cancelada') {
                    showToast(`Error al exportar: ${result.message}`, 'danger');
                }
            } catch (error) {
                console.error('Error al exportar base de datos:', error);
                showToast('Error interno al exportar la base de datos.', 'danger');
            } finally {
                btnExportDb.disabled = false;
            }
        });

        btnImportDb.addEventListener('click', async () => {
            const confirm = await showCustomConfirm(
                '¿Estás seguro de que deseas importar la base de datos? Se sobrescribirán todos los datos actuales y la aplicación se reiniciará automáticamente.'
            );
            if (!confirm) return;

            try {
                btnImportDb.disabled = true;
                const result = await window.database.import();
                if (result && !result.success) {
                    if (result.message !== 'Operación cancelada') {
                        showToast(`Error al importar: ${result.message}`, 'danger');
                    }
                }
            } catch (error) {
                console.error('Error al importar base de datos:', error);
                showToast('Error interno al importar la base de datos.', 'danger');
            } finally {
                btnImportDb.disabled = false;
            }
        });
    } else {
        // Fuera de Electron (desarrollo en navegador)
        if (btnExportDb) btnExportDb.disabled = true;
        if (btnImportDb) btnImportDb.disabled = true;
    }

    // Iniciar
    loadConfig();
});
