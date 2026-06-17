import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaClientes = null;
let formAgregarCliente = null;
let btnGuardarCliente = null;
let modalAgregarCliente = null;

// Modal Editar Cliente
let editClienteModal = null;
let modalEditarCliente = null;
let btnActualizarCliente = null;

// Modal Ver Pedidos
let verPedidosModal = null;
let tablaPedidosBody = null;
let inputFechaMin = null;
let inputFechaMax = null;
let btnLimpiarFiltros = null;

let currentClienteId = null;
let currentClienteNombre = '';
const todayStr = new Date().toISOString().split('T')[0];

let productos = [];
let pedidosClienteCurrent = [];

// Service local para clientes
const clientesService = {
    getAll: () => apiClient.get('/clientes'),
    getById: (id) => apiClient.get(`/clientes/${id}`),
    create: (clienteData) => apiClient.post('/clientes', clienteData),
    update: (id, clienteData) => apiClient.put(`/clientes/${id}`, clienteData),
    delete: (id) => apiClient.delete(`/clientes/${id}`),
    getProductos: () => apiClient.get('/products/all'),
    getPedidos: (clienteId, fechaMin, fechaMax) => 
        apiClient.get(`/ventas/cliente/${clienteId}?limit=50&fechaMin=${fechaMin}&fechaMax=${fechaMax}`),
};

/**
 * Inicializa los elementos del DOM
 */
function inicializarElementos() {
    tablaClientes = document.querySelector('tbody');
    formAgregarCliente = document.getElementById('addClienteForm');
    btnGuardarCliente = document.querySelector('#addClienteModal .modal-footer .btn-primary');
    
    // Modal Editar
    editClienteModal = document.getElementById('editClienteModal');
    btnActualizarCliente = document.getElementById('btnActualizarCliente');

    // Modal Pedidos
    verPedidosModal = document.getElementById('verPedidosModal');
    tablaPedidosBody = document.getElementById('tablaPedidosClienteBody');
    inputFechaMin = document.getElementById('filtroFechaMin');
    inputFechaMax = document.getElementById('filtroFechaMax');
    btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

    if (!tablaClientes) {
        console.error('No se encontró la tabla de clientes');
        return false;
    }
    
    if (btnGuardarCliente) {
        modalAgregarCliente = new bootstrap.Modal(document.getElementById('addClienteModal'));
    }

    if (editClienteModal) {
        modalEditarCliente = new bootstrap.Modal(editClienteModal);
    }
    
    return true;
}

/**
 * Carga los pedidos/ventas del cliente seleccionado
 */
async function cargarPedidosCliente() {
    if (!currentClienteId) return;

    const minDate = inputFechaMin.value;
    const maxDate = inputFechaMax.value;

    try {
        console.log(`Cargando pedidos para cliente ${currentClienteId} entre ${minDate} y ${maxDate}...`);
        tablaPedidosBody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-3"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

        const respuesta = await clientesService.getPedidos(currentClienteId, minDate, maxDate);
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta de pedidos inválida:', respuesta);
            tablaPedidosBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3">Error al cargar pedidos</td></tr>';
            return;
        }

        pedidosClienteCurrent = respuesta.data;
        tablaPedidosBody.innerHTML = '';

        if (pedidosClienteCurrent.length === 0) {
            tablaPedidosBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-secondary py-3">No hay pedidos registrados para este periodo.</td>
                </tr>
            `;
            return;
        }

        pedidosClienteCurrent.forEach(p => {
            const empleadoCompleto = p.empleadoNombre && p.empleadoApellido 
                ? `${p.empleadoNombre} ${p.empleadoApellido}` 
                : (p.empleadoNombre || 'N/A');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-white">${p.fechaEmision || 'N/A'}</td>
                <td class="text-white">${empleadoCompleto}</td>
                <td class="text-white">$${Number(p.total).toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-ver-detalle-pedido" data-id="${p.id}" title="Ver Detalle de Pedido">
                        <i class="fas fa-eye" style="color: #60a5fa;"></i>
                    </button>
                </td>
            `;
            tablaPedidosBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error al cargar pedidos del cliente:', error);
        tablaPedidosBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Error: ${error.message}</td></tr>`;
    }
}

/**
 * Carga todos los productos en memoria para poder asociar nombres a IDs
 */
async function cargarProductos() {
    try {
        const respuesta = await clientesService.getProductos();
        productos = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
        console.log('Productos cargados en Clientes:', productos.length);
    } catch (error) {
        console.error('Error al cargar productos en Clientes:', error);
    }
}

/**
 * Busca y muestra el detalle de productos del pedido seleccionado del historial
 */
function mostrarDetallePedidoCliente(pedidoId) {
    const pedido = pedidosClienteCurrent.find(p => String(p.id) === String(pedidoId));
    if (!pedido) {
        console.error('Pedido no encontrado en historial cargado:', pedidoId);
        return;
    }

    const empleadoCompleto = pedido.empleadoNombre && pedido.empleadoApellido 
        ? `${pedido.empleadoNombre} ${pedido.empleadoApellido}` 
        : (pedido.empleadoNombre || 'N/A');

    document.getElementById('detPedidoFecha').textContent = pedido.fechaEmision || 'N/A';
    document.getElementById('detPedidoEmpleado').textContent = empleadoCompleto;

    const tbody = document.getElementById('detPedidoProductosBody');
    tbody.innerHTML = '';

    if (!pedido.detalles || pedido.detalles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-secondary py-3">No hay productos en este pedido</td></tr>';
    } else {
        pedido.detalles.forEach(d => {
            const product = productos.find(p => p.id === d.productId);
            const productName = product ? `${product.nombre} (${product.marca})` : `Producto #${d.productId}`;
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-white text-start">${productName}</td>
                <td class="text-white">$${Number(d.precio).toFixed(2)}</td>
                <td class="text-white">${d.cantidad}</td>
                <td class="text-white text-end">$${Number(d.subtotal).toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('detPedidoTotal').textContent = `$${Number(pedido.total).toFixed(2)}`;

    // Mostrar modal
    const modalEl = document.getElementById('verDetallePedidoModal');
    if (modalEl) {
        const modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
}

/**
 * Carga todos los clientes del backend y renderiza la tabla
 */
async function cargarClientes() {
    try {
        console.log('Cargando clientes...');
        const respuesta = await clientesService.getAll();
        
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta inválida:', respuesta);
            alert('Error: respuesta inválida del servidor');
            return;
        }
        
        const clientes = respuesta.data;
        console.log('Clientes cargados:', clientes);

        // Limpiar la tabla
        tablaClientes.innerHTML = '';

        if (clientes.length === 0) {
            tablaClientes.innerHTML = '<tr><td colspan="6" class="text-center">No hay clientes</td></tr>';
            return;
        }

        // Renderizar cada cliente
        clientes.forEach(cliente => {
            const fila = document.createElement('tr');
            const listaPreciosNombre = `Lista ${cliente.listaPreciosId || 1}`;
            fila.innerHTML = `
                <td>${cliente.nombre || 'N/A'}</td>
                <td>${cliente.direccion || 'N/A'}</td>
                <td>${cliente.contacto || 'Sin contacto'}</td>
                <td>
                    <button class="btn btn-sm btn-ver-pedidos" data-id="${cliente.id}" data-nombre="${cliente.nombre}" data-bs-toggle="modal" data-bs-target="#verPedidosModal" style="font-size: 0.75rem; border-radius: 6px; padding: 0.3rem 0.6rem; background-color: rgba(37, 99, 235, 0.15); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">Ver Pedidos</button>
                </td>
                <td>
                    <span class="badge" style="background-color: rgba(37, 99, 235, 0.1); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.25); font-weight: 500; font-size: 0.8rem; padding: 0.35rem 0.65rem; border-radius: 6px;">${listaPreciosNombre}</span>
                </td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${cliente.id}" data-nombre="${cliente.nombre || ''}" data-direccion="${cliente.direccion || ''}" data-contacto="${cliente.contacto || ''}" data-listaprecios="${cliente.listaPreciosId || 1}" data-bs-toggle="modal" data-bs-target="#editClienteModal" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm action-btn delete border-0 btn-eliminar" data-id="${cliente.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tablaClientes.appendChild(fila);
        });

        // Agregar eventos a los botones
        agregarEventosTabla();
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        tablaClientes.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
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
            await eliminarCliente(id);
        });
    });
}

/**
 * Elimina un cliente con confirmación
 */
async function eliminarCliente(id) {
    // Confirmar eliminación
    const confirmado = await showCustomConfirm('¿Estás seguro de que deseas eliminar este cliente? Se eliminarán también sus ventas asociadas.');
    if (!confirmado) {
        return;
    }

    try {
        console.log('Eliminando cliente:', id);
        const respuesta = await clientesService.delete(id);
        console.log('Respuesta de eliminación:', respuesta);
        showToast('Cliente eliminado exitosamente');
        await cargarClientes(); // Recargar la tabla
    } catch (error) {
        console.error('Error completo:', error);
        showToast('Hubo un error al eliminar el cliente.', 'error');
    }
}

/**
 * Maneja la creación de un nuevo cliente
 */
async function guardarCliente() {
    const nombre = document.getElementById('clienteNombre').value.trim();
    const direccion = document.getElementById('clienteDireccion').value.trim();
    const contacto = document.getElementById('clienteContacto').value.trim();
    const listaPreciosId = document.getElementById('clienteListaPrecios').value;

    // Validar campos obligatorios
    if (!nombre) {
        showToast('Por favor completa el nombre del cliente', 'error');
        return;
    }

    try {
        console.log('Creando cliente:', { nombre, direccion, contacto, listaPreciosId });
        await clientesService.create({
            nombre,
            direccion,
            contacto,
            listaPreciosId
        });

        showToast('Cliente creado exitosamente');
        formAgregarCliente.reset();
        modalAgregarCliente.hide();
        await cargarClientes(); // Recargar la tabla
    } catch (error) {
        console.error('Error al crear cliente:', error);
        showToast('Hubo un error al registrar el cliente.', 'error');
    }
}

/**
 * Maneja la actualización de un cliente existente
 */
async function actualizarCliente() {
    const id = document.getElementById('editClienteId').value;
    const nombre = document.getElementById('editClienteNombre').value.trim();
    const direccion = document.getElementById('editClienteDireccion').value.trim();
    const contacto = document.getElementById('editClienteContacto').value.trim();
    const listaPreciosId = document.getElementById('editClienteListaPrecios').value;

    // Validar campos obligatorios
    if (!nombre) {
        showToast('Por favor completa el nombre del cliente', 'error');
        return;
    }

    try {
        console.log('Actualizando cliente:', { id, nombre, direccion, contacto, listaPreciosId });
        await clientesService.update(id, {
            nombre,
            direccion,
            contacto,
            listaPreciosId
        });

        showToast('Cliente actualizado exitosamente');
        modalEditarCliente.hide();
        await cargarClientes(); // Recargar la tabla
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        showToast('Hubo un error al actualizar el cliente.', 'error');
    }
}

/**
 * Inicializa los eventos del formulario y modales
 */
function inicializarEventos() {
    if (btnGuardarCliente) {
        btnGuardarCliente.addEventListener('click', guardarCliente);
    }

    if (btnActualizarCliente) {
        btnActualizarCliente.addEventListener('click', actualizarCliente);
    }

    if (verPedidosModal) {
        verPedidosModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            currentClienteId = button.getAttribute('data-id');
            currentClienteNombre = button.getAttribute('data-nombre');
            document.getElementById('verPedidosModalLabel').textContent = `Historial de Pedidos de ${currentClienteNombre}`;

            // Por defecto hoy
            inputFechaMin.value = todayStr;
            inputFechaMax.value = todayStr;

            cargarPedidosCliente();
        });

        inputFechaMin.addEventListener('change', cargarPedidosCliente);
        inputFechaMax.addEventListener('change', cargarPedidosCliente);

        btnLimpiarFiltros.addEventListener('click', () => {
            inputFechaMin.value = todayStr;
            inputFechaMax.value = todayStr;
            cargarPedidosCliente();
        });

        // Delegación de eventos para ver el detalle de un pedido en el historial
        tablaPedidosBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-ver-detalle-pedido');
            if (btn) {
                const id = parseInt(btn.getAttribute('data-id'), 10);
                mostrarDetallePedidoCliente(id);
            }
        });

        // Corregir el scroll del body al cerrar el modal superpuesto de detalles
        const detModalEl = document.getElementById('verDetallePedidoModal');
        if (detModalEl) {
            detModalEl.addEventListener('hidden.bs.modal', () => {
                const listModal = document.getElementById('verPedidosModal');
                if (listModal && listModal.classList.contains('show')) {
                    document.body.classList.add('modal-open');
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    }

    if (editClienteModal) {
        editClienteModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            const id = button.getAttribute('data-id');
            const nombre = button.getAttribute('data-nombre');
            const direccion = button.getAttribute('data-direccion');
            const contacto = button.getAttribute('data-contacto');
            const listaPreciosId = button.getAttribute('data-listaprecios');

            document.getElementById('editClienteId').value = id;
            document.getElementById('editClienteNombre').value = nombre;
            document.getElementById('editClienteDireccion').value = direccion;
            document.getElementById('editClienteContacto').value = contacto || '';
            document.getElementById('editClienteListaPrecios').value = listaPreciosId || 1;
        });
    }

    const addModalEl = document.getElementById('addClienteModal');
    if (addModalEl) {
        addModalEl.addEventListener('hidden.bs.modal', () => {
            formAgregarCliente.reset();
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
    console.log('Página de clientes cargada, inicializando...');
    
    if (inicializarElementos()) {
        cargarClientes();
        cargarProductos();
        inicializarEventos();
    }
});
