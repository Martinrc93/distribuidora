import { apiClient } from '../../api/apiClient.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast, showCustomConfirm } from '../../utils/ui.js';

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

let productos = [];
let pedidosEmpleadoCurrent = [];

// Service local para empleados
const empleadosService = {
    getAll: () => apiClient.get('/empleados'),
    getById: (id) => apiClient.get(`/empleados/${id}`),
    create: (empleadoData) => apiClient.post('/empleados', empleadoData),
    update: (id, empleadoData) => apiClient.put(`/empleados/${id}`, empleadoData),
    delete: (id) => apiClient.delete(`/empleados/${id}`),
    getPedidos: (empleadoId, fechaMin, fechaMax) => 
        apiClient.get(`/ventas/empleado/${empleadoId}?limit=50&fechaMin=${fechaMin}&fechaMax=${fechaMax}`),
    getProductos: () => apiClient.get('/products/all'),
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
 * Carga todos los productos en memoria para poder asociar nombres a IDs
 */
async function cargarProductos() {
    try {
        const respuesta = await empleadosService.getProductos();
        productos = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
        console.log('Productos cargados en Empleados:', productos.length);
    } catch (error) {
        console.error('Error al cargar productos en Empleados:', error);
    }
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
        tablaPedidosBody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary py-3"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';

        const respuesta = await empleadosService.getPedidos(currentEmpleadoId, minDate, maxDate);
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta de pedidos inválida:', respuesta);
            tablaPedidosBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3">Error al cargar pedidos</td></tr>';
            return;
        }

        pedidosEmpleadoCurrent = respuesta.data;
        tablaPedidosBody.innerHTML = '';

        if (pedidosEmpleadoCurrent.length === 0) {
            tablaPedidosBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-secondary py-3">No hay pedidos registrados para este periodo.</td>
                </tr>
            `;
            return;
        }

        pedidosEmpleadoCurrent.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-white">${escapeHtml(p.fechaEmision) || 'N/A'}</td>
                <td class="text-white">${escapeHtml(p.clienteNombre) || 'N/A'}</td>
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
        console.error('Error al cargar pedidos del empleado:', error);
        tablaPedidosBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Error: ${escapeHtml(error.message)}</td></tr>`;
    }
}

/**
 * Muestra el detalle de productos del pedido seleccionado del historial del empleado
 */
function mostrarDetallePedidoEmpleado(pedidoId) {
    const pedido = pedidosEmpleadoCurrent.find(p => String(p.id) === String(pedidoId));
    if (!pedido) {
        console.error('Pedido no encontrado en historial cargado:', pedidoId);
        return;
    }

    document.getElementById('detPedidoFecha').textContent = pedido.fechaEmision || 'N/A';
    document.getElementById('detPedidoCliente').textContent = pedido.clienteNombre || 'N/A';

    const tbody = document.getElementById('detPedidoProductosBody');
    tbody.innerHTML = '';

    if (!pedido.detalles || pedido.detalles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-secondary py-3">No hay productos en este pedido</td></tr>';
    } else {
        pedido.detalles.forEach(d => {
            const product = productos.find(p => p.id === d.productId);
            const productName = product 
                ? `${escapeHtml(product.nombre)} (${escapeHtml(product.marca)})` 
                : `Producto #${d.productId}`;
            
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
            
            const nombreCompleto = `${escapeHtml(empleado.nombre || 'N/A')} ${escapeHtml(empleado.apellido || 'N/A')}`;
            
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${nombreCompleto}</td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-sm btn-ver-pedidos" data-id="${empleado.id}" data-nombre="${nombreCompleto}" data-bs-toggle="modal" data-bs-target="#verPedidosModal" style="font-size: 0.75rem; border-radius: 6px; padding: 0.3rem 0.6rem; background-color: rgba(37, 99, 235, 0.15); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">Ver Pedidos</button>
                </td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${empleado.id}" data-nombre="${escapeHtml(empleado.nombre || '')}" data-apellido="${escapeHtml(empleado.apellido || '')}" data-active="${empleado.active}" data-bs-toggle="modal" data-bs-target="#editEmpleadoModal" title="Editar">
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
        tablaEmpleados.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error: ${escapeHtml(error.message)}</td></tr>`;
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

        // Delegación de eventos para ver el detalle de un pedido en el historial
        tablaPedidosBody.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-ver-detalle-pedido');
            if (btn) {
                const id = parseInt(btn.getAttribute('data-id'), 10);
                mostrarDetallePedidoEmpleado(id);
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
 * Inicializa la página
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de empleados cargada, inicializando...');
    
    if (inicializarElementos()) {
        cargarProductos();
        cargarEmpleados();
        inicializarEventos();
    }
});
