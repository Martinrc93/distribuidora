import { apiClient } from '../../api/apiClient.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast, showCustomConfirm } from '../../utils/ui.js';

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
const getLocalDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const todayStr = getLocalDateStr();

let productos = [];
let pedidosClienteCurrent = [];

// Variables de paginación
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 10;

// Service local para clientes
const clientesService = {
    getAll: (page = 1, limit = 10, q = '') => apiClient.get(`/clientes?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`),
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
                <td class="text-white">${escapeHtml(p.fechaEmision) || 'N/A'}</td>
                <td class="text-white">${escapeHtml(empleadoCompleto)}</td>
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
        tablaPedidosBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Error: ${escapeHtml(error.message)}</td></tr>`;
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
            const product = productos.find(p => p.id === d.productoId);
            let brand = '';
            if (product && product.marca) {
                brand = product.marca.trim();
                brand = brand.charAt(0).toUpperCase() + brand.slice(1);
            }
            const productName = product 
                ? `${escapeHtml(brand)} - ${escapeHtml(product.nombre)}` 
                : `Producto #${d.productoId}`;
            
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
 * Carga los clientes del backend con paginación y renderiza la tabla
 * @param {number} page Número de página a cargar.
 */
async function cargarClientes(page = 1) {
    try {
        const searchInput = document.getElementById('clienteSearchInput');
        const q = searchInput ? searchInput.value.trim() : '';

        console.log('Cargando clientes, página:', page, 'búsqueda:', q);
        const respuesta = await clientesService.getAll(page, itemsPerPage, q);
        
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta inválida:', respuesta);
            showToast('Error: respuesta inválida del servidor', 'error');
            return;
        }
        
        const clientes = respuesta.data;
        currentPage = respuesta.paginaActual || page;
        totalPages = respuesta.paginas || 1;
        const totalItems = respuesta.total || 0;
        console.log('Clientes cargados:', clientes);

        // Si la página actual se quedó vacía pero hay items (por ejemplo tras eliminar el último item de una página)
        if (clientes.length === 0 && currentPage > 1 && totalItems > 0) {
            await cargarClientes(currentPage - 1);
            return;
        }

        // Limpiar la tabla
        tablaClientes.innerHTML = '';

        if (clientes.length === 0) {
            tablaClientes.innerHTML = '<tr><td colspan="6" class="text-center">No hay clientes</td></tr>';
            renderPaginationControls(0);
            return;
        }

        // Renderizar cada cliente
        clientes.forEach(cliente => {
            const fila = document.createElement('tr');
            const listaPreciosNombre = `Lista ${cliente.listaPreciosId || 1}`;
            const contactoDisplay = (!cliente.contacto || cliente.contacto.replace(/\s+/g, '') === '54911') 
                ? 'Sin contacto' 
                : cliente.contacto;
            fila.innerHTML = `
                <td>${escapeHtml(cliente.nombre) || 'N/A'}</td>
                <td>${escapeHtml(cliente.direccion) || 'N/A'}</td>
                <td>${escapeHtml(contactoDisplay)}</td>
                <td>
                    <button class="btn btn-sm btn-ver-pedidos" data-id="${cliente.id}" data-nombre="${escapeHtml(cliente.nombre)}" data-bs-toggle="modal" data-bs-target="#verPedidosModal" style="font-size: 0.75rem; border-radius: 6px; padding: 0.3rem 0.6rem; background-color: rgba(37, 99, 235, 0.15); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">Ver Pedidos</button>
                </td>
                <td>
                    <span class="badge" style="background-color: rgba(37, 99, 235, 0.1); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.25); font-weight: 500; font-size: 0.8rem; padding: 0.35rem 0.65rem; border-radius: 6px;">${escapeHtml(listaPreciosNombre)}</span>
                </td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${cliente.id}" data-nombre="${escapeHtml(cliente.nombre || '')}" data-direccion="${escapeHtml(cliente.direccion || '')}" data-contacto="${escapeHtml(cliente.contacto || '')}" data-listaprecios="${cliente.listaPreciosId || 1}" data-bs-toggle="modal" data-bs-target="#editClienteModal" title="Editar">
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

        // Renderizar controles de paginación
        renderPaginationControls(totalItems);
    } catch (error) {
        console.error('Error al cargar clientes:', error);
        tablaClientes.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${escapeHtml(error.message)}</td></tr>`;
    }
}

/**
 * Renderiza los controles de paginación
 * @param {number} totalItems Cantidad total de clientes en la base de datos
 */
function renderPaginationControls(totalItems) {
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationList = document.getElementById('paginationList');
    if (!paginationInfo || !paginationList) return;

    // Actualizar texto informativo
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    paginationInfo.textContent = totalItems > 0 
        ? `Mostrando ${startItem}-${endItem} de ${totalItems} clientes`
        : 'Mostrando 0-0 de 0 clientes';

    // Limpiar botones
    paginationList.innerHTML = '';

    if (totalItems === 0) return;

    // Botón Anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<button class="page-link" aria-label="Anterior" type="button"><i class="fas fa-chevron-left"></i></button>`;
    if (currentPage > 1) {
        prevLi.querySelector('button').addEventListener('click', () => cargarClientes(currentPage - 1));
    }
    paginationList.appendChild(prevLi);

    // Botones Numéricos con ventana deslizable
    const maxVisiblePages = window.innerWidth < 576 ? 3 : 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<button class="page-link" type="button">${i}</button>`;
        if (i !== currentPage) {
            pageLi.querySelector('button').addEventListener('click', () => cargarClientes(i));
        }
        paginationList.appendChild(pageLi);
    }

    // Botón Siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<button class="page-link" aria-label="Siguiente" type="button"><i class="fas fa-chevron-right"></i></button>`;
    if (currentPage < totalPages) {
        nextLi.querySelector('button').addEventListener('click', () => cargarClientes(currentPage + 1));
    }
    paginationList.appendChild(nextLi);
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
        await cargarClientes(currentPage); // Recargar la tabla en la página actual
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
    
    let codInt = document.getElementById('clienteCodInt').value.trim() || '54 9';
    codInt = codInt.replace(/^\+/, '');
    const codArea = document.getElementById('clienteCodArea').value.trim();
    const numTel = document.getElementById('clienteNumTel').value.trim();
    const contacto = numTel 
        ? `${codInt} ${codArea} ${numTel}`.trim().replace(/\s+/g, ' ') 
        : `${codInt} ${codArea}`.trim().replace(/\s+/g, '');

    const listaPreciosId = parseInt(document.getElementById('clienteListaPrecios').value, 10);

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
        await cargarClientes(1); // Recargar la tabla en la primera página para ver el cliente recién creado
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
    
    let codInt = document.getElementById('editClienteCodInt').value.trim() || '54 9';
    codInt = codInt.replace(/^\+/, '');
    const codArea = document.getElementById('editClienteCodArea').value.trim();
    const numTel = document.getElementById('editClienteNumTel').value.trim();
    const contacto = numTel 
        ? `${codInt} ${codArea} ${numTel}`.trim().replace(/\s+/g, ' ') 
        : `${codInt} ${codArea}`.trim().replace(/\s+/g, '');

    const listaPreciosId = parseInt(document.getElementById('editClienteListaPrecios').value, 10);

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
        await cargarClientes(currentPage); // Recargar la tabla en la página actual
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
            const contacto = (button.getAttribute('data-contacto') || '').trim();
            const listaPreciosId = button.getAttribute('data-listaprecios');

            let codInt = '54 9';
            let codArea = '11';
            let numTel = contacto;

            if (contacto) {
                const match = contacto.match(/^(\+?\d+(?:\s+\d+)?)\s+(\d+)\s+(.+)$/);
                if (match) {
                    codInt = match[1].replace(/^\+/, '');
                    codArea = match[2];
                    numTel = match[3];
                } else {
                    const normalized = contacto.replace(/\s+/g, '');
                    if (normalized === '54911') {
                        codInt = '54 9';
                        codArea = '11';
                        numTel = '';
                    } else if (normalized.startsWith('54911')) {
                        codInt = '54 9';
                        codArea = '11';
                        numTel = normalized.substring(5);
                    } else {
                        codInt = '54 9';
                        codArea = '11';
                        numTel = contacto;
                    }
                }
            }

            document.getElementById('editClienteId').value = id;
            document.getElementById('editClienteNombre').value = nombre;
            document.getElementById('editClienteDireccion').value = direccion;
            document.getElementById('editClienteCodInt').value = codInt;
            document.getElementById('editClienteCodArea').value = codArea;
            document.getElementById('editClienteNumTel').value = numTel;
            document.getElementById('editClienteListaPrecios').value = listaPreciosId || 1;
        });
    }

    const addModalEl = document.getElementById('addClienteModal');
    if (addModalEl) {
        addModalEl.addEventListener('hidden.bs.modal', () => {
            formAgregarCliente.reset();
        });
    }

    // Buscador con Debounce
    const searchInput = document.getElementById('clienteSearchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                cargarClientes(1);
            }, 300);
        });
    }
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
