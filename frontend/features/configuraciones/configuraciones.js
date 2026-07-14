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

    // Iniciar
    loadConfig();
});
