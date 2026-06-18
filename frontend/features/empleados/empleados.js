import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaEmpleados = null;
let formAgregarEmpleado = null;
let btnGuardarEmpleado = null;
let modalAgregarEmpleado = null;

// Modal Ver Pedidos
let verPedidosModal = null;
let modalPedidosTitle = null;
let tablaPedidosBody = null;
let inputFechaMin = null;
let inputFechaMax = null;
let btnLimpiarFiltros = null;

// Modal Editar Empleado
let editEmpleadoModal = null;
let modalEditarEmpleado = null;
let btnActualizarEmpleado = null;

let currentEmpleadoId = null;
let currentEmpleadoNombre = '';
const todayStr = new Date().toISOString().split('T')[0];

// Service local para empleados
const empleadosService = {
    getAll: () => apiClient.get('/empleados'),
    getById: (id) => apiClient.get(`/empleados/${id}`),
    create: (empleadoData) => apiClient.post('/empleados', empleadoData),
    update: (id, empleadoData) => apiClient.put(`/empleados/${id}`, empleadoData),
    delete: (id) => apiClient.delete(`/empleados/${id}`),
    getPedidos: (empleadoId, fechaMin, fechaMax) => 
        apiClient.get(`/ventas/empleado/${empleadoId}?limit=50&fechaMin=${fechaMin}&fechaMax=${fechaMax}`),
};

/**
 * Inicializa los elementos del DOM
 */
function inicializarElementos() {
    tablaEmpleados = document.querySelector('tbody');
    formAgregarEmpleado = document.getElementById('addEmpleadoForm');
    btnGuardarEmpleado = document.querySelector('#addEmpleadoModal .modal-footer .btn-primary');
    
    // Modal Ver Pedidos
    verPedidosModal = document.getElementById('verPedidosModal');
    modalPedidosTitle = document.getElementById('verPedidosModalLabel');
    tablaPedidosBody = document.getElementById('tablaPedidosEmpleadoBody');
    inputFechaMin = document.getElementById('filtroFechaMin');
    inputFechaMax = document.getElementById('filtroFechaMax');
    btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

    // Modal Editar Empleado
    editEmpleadoModal = document.getElementById('editEmpleadoModal');
    btnActualizarEmpleado = document.getElementById('btnActualizarEmpleado');

    if (!tablaEmpleados) {
        console.error('No se encontró la tabla de empleados');
        return false;
    }
    
    if (btnGuardarEmpleado) {
        modalAgregarEmpleado = new bootstrap.Modal(document.getElementById('addEmpleadoModal'));
    }

    if (editEmpleadoModal) {
        modalEditarEmpleado = new bootstrap.Modal(editEmpleadoModal);
    }
    
    return true;
}

/**
 * Carga los pedidos/ventas del empleado seleccionado
 */
async function cargarPedidosEmpleado() {
    if (!currentEmpleadoId) return;

    const minDate = inputFechaMin.value;
    const maxDate = inputFechaMax.value;

    try {
        console.log(`Cargando pedidos para empleado ${currentEmpleadoId} entre ${minDate} y ${maxDate}...`);
        tablaPedidosBody.innerHTML = '<tr><td colspan="3" class="text-center text-secondary py-3"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

        const respuesta = await empleadosService.getPedidos(currentEmpleadoId, minDate, maxDate);
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta de pedidos inválida:', respuesta);
            tablaPedidosBody.innerHTML = '<tr><td colspan="3" class="text-center text-danger py-3">Error al cargar pedidos</td></tr>';
            return;
        }

        const pedidos = respuesta.data;
        tablaPedidosBody.innerHTML = '';

        if (pedidos.length === 0) {
            tablaPedidosBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-secondary py-3">No hay pedidos registrados para este periodo.</td>
                </tr>
            `;
            return;
        }

        pedidos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-white">${p.fechaEmision || 'N/A'}</td>
                <td class="text-white">${p.clienteNombre || 'N/A'}</td>
                <td class="text-white">$${Number(p.total).toFixed(2)}</td>
            `;
            tablaPedidosBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error al cargar pedidos del empleado:', error);
        tablaPedidosBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-3">Error: ${error.message}</td></tr>`;
    }
}

/**
 * Carga todos los empleados del backend y renderiza la tabla
 */
async function cargarEmpleados() {
    try {
        console.log('Cargando empleados...');
        const respuesta = await empleadosService.getAll();
        
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta inválida:', respuesta);
            showToast('Error: respuesta inválida del servidor', 'error');
            return;
        }
        
        const empleados = respuesta.data;
        console.log('Empleados cargados:', empleados);

        // Limpiar la tabla
        tablaEmpleados.innerHTML = '';

        if (empleados.length === 0) {
            tablaEmpleados.innerHTML = '<tr><td colspan="4" class="text-center">No hay empleados</td></tr>';
            return;
        }

        // Renderizar cada empleado
        empleados.forEach(empleado => {
            const estadoBadge = empleado.active 
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-secondary">Inactivo</span>';
            
            const nombreCompleto = `${empleado.nombre || 'N/A'} ${empleado.apellido || 'N/A'}`;
            
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${nombreCompleto}</td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-sm btn-ver-pedidos" data-id="${empleado.id}" data-nombre="${nombreCompleto}" data-bs-toggle="modal" data-bs-target="#verPedidosModal" style="font-size: 0.75rem; border-radius: 6px; padding: 0.3rem 0.6rem; background-color: rgba(37, 99, 235, 0.15); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">Ver Pedidos</button>
                </td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${empleado.id}" data-nombre="${empleado.nombre || ''}" data-apellido="${empleado.apellido || ''}" data-active="${empleado.active}" data-bs-toggle="modal" data-bs-target="#editEmpleadoModal" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm action-btn delete border-0 btn-eliminar" data-id="${empleado.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tablaEmpleados.appendChild(fila);
        });

        // Agregar eventos a los botones
        agregarEventosTabla();
    } catch (error) {
        console.error('Error al cargar empleados:', error);
        tablaEmpleados.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }
}

/**
 * Agrega eventos a los botones de editar y eliminar
 */
function agregarEventosTabla() {
    // Eventos para eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            await eliminarEmpleado(id);
        });
    });
}

/**
 * Elimina un empleado con confirmación
 */
async function eliminarEmpleado(id) {
    // Confirmar eliminación
    const confirmado = await showCustomConfirm('¿Estás seguro de que deseas eliminar este empleado? Se eliminarán también sus ventas asociadas.');
    if (!confirmado) {
        return;
    }

    try {
        console.log('Eliminando empleado:', id);
        const respuesta = await empleadosService.delete(id);
        console.log('Respuesta de eliminación:', respuesta);
        showToast('Empleado eliminado exitosamente');
        await cargarEmpleados(); // Recargar la tabla
    } catch (error) {
        console.error('Error completo:', error);
        showToast('Hubo un error al eliminar el empleado.', 'error');
    }
}

/**
 * Maneja la creación de un nuevo empleado
 */
async function guardarEmpleado() {
    const nombre = document.getElementById('empleadoNombre').value.trim();
    const apellido = document.getElementById('empleadoApellido').value.trim();
    const estado = document.getElementById('empleadoEstado').value;

    // Validar campos obligatorios
    if (!nombre || !apellido) {
        showToast('Por favor completa el nombre y apellido del empleado', 'error');
        return;
    }

    try {
        console.log('Creando empleado:', { nombre, apellido, estado });
        
        // Convertir estado a booleano
        const active = estado === 'activo' || estado === 'true' || estado === true;
        
        await empleadosService.create({
            nombre,
            apellido,
            active
        });

        showToast('Empleado creado exitosamente');
        formAgregarEmpleado.reset();
        modalAgregarEmpleado.hide();
        await cargarEmpleados(); // Recargar la tabla
    } catch (error) {
        console.error('Error al crear empleado:', error);
        showToast('Hubo un error al registrar el empleado.', 'error');
    }
}

/**
 * Maneja la actualización de un empleado existente
 */
async function actualizarEmpleado() {
    const id = document.getElementById('editEmpleadoId').value;
    const nombre = document.getElementById('editEmpleadoNombre').value.trim();
    const apellido = document.getElementById('editEmpleadoApellido').value.trim();
    const estado = document.getElementById('editEmpleadoEstado').value;

    // Validar campos obligatorios
    if (!nombre || !apellido) {
        showToast('Por favor completa el nombre y apellido del empleado', 'error');
        return;
    }

    try {
        console.log('Actualizando empleado:', { id, nombre, apellido, estado });
        
        // Convertir estado a booleano
        const active = estado === 'activo';
        
        await empleadosService.update(id, {
            nombre,
            apellido,
            active
        });

        showToast('Empleado actualizado exitosamente');
        modalEditarEmpleado.hide();
        await cargarEmpleados(); // Recargar la tabla
    } catch (error) {
        console.error('Error al actualizar empleado:', error);
        showToast('Hubo un error al actualizar el empleado.', 'error');
    }
}

/**
 * Inicializa los eventos del formulario y modales
 */
function inicializarEventos() {
    if (btnGuardarEmpleado) {
        btnGuardarEmpleado.addEventListener('click', guardarEmpleado);
    }

    if (btnActualizarEmpleado) {
        btnActualizarEmpleado.addEventListener('click', actualizarEmpleado);
    }

    if (verPedidosModal) {
        // Al abrir el modal, inicializar datos y cargar pedidos
        verPedidosModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            currentEmpleadoId = button.getAttribute('data-id');
            currentEmpleadoNombre = button.getAttribute('data-nombre');
            modalPedidosTitle.textContent = `Pedidos de ${currentEmpleadoNombre}`;

            // Por defecto hoy
            inputFechaMin.value = todayStr;
            inputFechaMax.value = todayStr;

            cargarPedidosEmpleado();
        });

        // Escuchar cambios en los inputs de fecha
        inputFechaMin.addEventListener('change', cargarPedidosEmpleado);
        inputFechaMax.addEventListener('change', cargarPedidosEmpleado);

        // Botón para volver a "Hoy"
        btnLimpiarFiltros.addEventListener('click', () => {
            inputFechaMin.value = todayStr;
            inputFechaMax.value = todayStr;
            cargarPedidosEmpleado();
        });
    }

    if (editEmpleadoModal) {
        // Al abrir el modal de edición, rellenar los campos
        editEmpleadoModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            const id = button.getAttribute('data-id');
            const nombre = button.getAttribute('data-nombre');
            const apellido = button.getAttribute('data-apellido');
            const active = button.getAttribute('data-active') === 'true' || button.getAttribute('data-active') === '1';

            document.getElementById('editEmpleadoId').value = id;
            document.getElementById('editEmpleadoNombre').value = nombre;
            document.getElementById('editEmpleadoApellido').value = apellido;
            document.getElementById('editEmpleadoEstado').value = active ? 'activo' : 'inactivo';
        });
    }

    // Resetear formulario de creación al cerrar
    const addModalEl = document.getElementById('addEmpleadoModal');
    if (addModalEl) {
        addModalEl.addEventListener('hidden.bs.modal', () => {
            formAgregarEmpleado.reset();
        });
    }
}

/**
 * Muestra una notificación toast elegante y autodescartable
 * @param {string} mensaje - El texto a mostrar
 * @param {string} tipo - El tipo de toast ('success' o 'error')
 */
function showToast(mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Crear el elemento del toast
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
 * Muestra una ventana modal de confirmación personalizada
 * @param {string} mensaje - Mensaje a mostrar en la ventana
 * @returns {Promise<boolean>} Promesa que se resuelve con true si acepta, false si cancela
 */
function showCustomConfirm(mensaje) {
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
        
        // Animación de entrada
        setTimeout(() => overlay.classList.add('show'), 10);
        
        const closeConfirm = (res) => {
            overlay.classList.remove('show');
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
            });
            resolve(res);
        };
        
        overlay.querySelector('.btn-confirm-cancel').addEventListener('click', () => {
            closeConfirm(false);
        });
        
        overlay.querySelector('.btn-confirm-accept').addEventListener('click', () => {
            closeConfirm(true);
        });
        
        // Cerrar al hacer clic en el overlay (cancelar)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeConfirm(false);
            }
        });
    });
}

/**
 * Inicializa la página
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de empleados cargada, inicializando...');
    
    if (inicializarElementos()) {
        cargarEmpleados();
        inicializarEventos();
    }
});
