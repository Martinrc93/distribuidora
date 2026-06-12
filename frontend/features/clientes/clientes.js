import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaClientes = null;
let formAgregarCliente = null;
let btnGuardarCliente = null;
let modalAgregarCliente = null;

// Elementos del DOM para el modal de Ver Pedidos
let verPedidosModalElement = null;
let modalVerPedidos = null;
let tablaPedidosClienteBody = null;
let inputFechaMin = null;
let inputFechaMax = null;
let btnLimpiarFiltros = null;

// Variables de estado del cliente activo para ver pedidos
let currentClienteId = null;
let currentClienteNombre = null;

// Service local para clientes
const clientesService = {
    getAll: () => apiClient.get('/clientes'),
    getById: (id) => apiClient.get(`/clientes/${id}`),
    create: (clienteData) => apiClient.post('/clientes', clienteData),
    update: (id, clienteData) => apiClient.put(`/clientes/${id}`, clienteData),
    delete: (id) => apiClient.delete(`/clientes/${id}`),
};

/**
 * Inicializa los elementos del DOM
 */
function inicializarElementos() {
    tablaClientes = document.querySelector('tbody');
    formAgregarCliente = document.getElementById('addClienteForm');
    btnGuardarCliente = document.querySelector('#addClienteModal .modal-footer .btn-primary');
    
    // Elementos del modal de ver pedidos
    verPedidosModalElement = document.getElementById('verPedidosModal');
    tablaPedidosClienteBody = document.getElementById('tablaPedidosClienteBody');
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
    
    if (verPedidosModalElement) {
        modalVerPedidos = new bootstrap.Modal(verPedidosModalElement);
    }
    
    return true;
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
            fila.innerHTML = `
                <td>${cliente.nombre || 'N/A'}</td>
                <td>${cliente.direccion || 'N/A'}</td>
                <td>Sin contacto</td>
                <td>
                    <button class="btn btn-sm btn-ver-pedidos" style="font-size: 0.75rem; border-radius: 6px; padding: 0.3rem 0.6rem; background-color: rgba(37, 99, 235, 0.15); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.3); transition: all 0.3s ease;" data-id="${cliente.id}" data-nombre="${cliente.nombre}">Ver Pedidos</button>
                </td>
                <td>
                    <span class="badge" style="background-color: rgba(37, 99, 235, 0.1); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.25); font-weight: 500; font-size: 0.8rem; padding: 0.35rem 0.65rem; border-radius: 6px;">${cliente.listaPrecioNombre || 'Lista 1'}</span>
                </td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${cliente.id}" title="Editar">
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

    // Eventos para editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            console.log('Editar cliente:', id);
            try {
                const cliente = await clientesService.getById(id);
                document.getElementById('clienteNombre').value = cliente.nombre || '';
                document.getElementById('clienteDireccion').value = cliente.direccion || '';
                document.getElementById('clienteListaPrecios').value = cliente.listaPrecioId || '1';
                
                formAgregarCliente.setAttribute('data-edit-id', id);
                document.getElementById('addClienteModalLabel').textContent = 'Editar Cliente';
                modalAgregarCliente.show();
            } catch (error) {
                console.error('Error al cargar datos del cliente:', error);
                alert('Error al cargar datos del cliente');
            }
        });
    });

    // Eventos para ver pedidos
    document.querySelectorAll('.btn-ver-pedidos').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentClienteId = btn.getAttribute('data-id');
            currentClienteNombre = btn.getAttribute('data-nombre');
            
            if (modalVerPedidos) {
                modalVerPedidos.show();
            }
        });
    });
}

/**
 * Elimina un cliente con confirmación
 */
async function eliminarCliente(id) {
    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente? Se eliminarán también sus ventas asociadas.')) {
        return;
    }

    try {
        console.log('Eliminando cliente:', id);
        const respuesta = await clientesService.delete(id);
        console.log('Respuesta de eliminación:', respuesta);
        alert('Cliente eliminado exitosamente');
        await cargarClientes(); // Recargar la tabla
    } catch (error) {
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Data:', error.data);
        const mensaje = error.data?.mensaje || error.data?.error || error.message || 'Error desconocido';
        alert('Error al eliminar el cliente: ' + mensaje);
    }
}

/**
 * Maneja la creación o edición de un cliente
 */
async function guardarCliente() {
    const nombre = document.getElementById('clienteNombre').value.trim();
    const direccion = document.getElementById('clienteDireccion').value.trim();
    const listaPrecioId = parseInt(document.getElementById('clienteListaPrecios').value, 10);

    // Validar campos obligatorios
    if (!nombre || isNaN(listaPrecioId)) {
        alert('Por favor completa los campos obligatorios');
        return;
    }

    try {
        const editId = formAgregarCliente.getAttribute('data-edit-id');
        if (editId) {
            console.log('Actualizando cliente:', editId, { nombre, direccion, listaPrecioId });
            await clientesService.update(editId, { nombre, direccion, listaPrecioId });
            alert('Cliente actualizado exitosamente');
            formAgregarCliente.removeAttribute('data-edit-id');
        } else {
            console.log('Creando cliente:', { nombre, direccion, listaPrecioId });
            await clientesService.create({
                nombre,
                direccion,
                listaPrecioId
            });
            alert('Cliente creado exitosamente');
        }

        formAgregarCliente.reset();
        modalAgregarCliente.hide();
        await cargarClientes(); // Recargar la tabla
    } catch (error) {
        console.error('Error al guardar cliente:', error);
        const mensaje = error.data?.errores?.[0] || error.data?.mensaje || error.message;
        alert('Error al guardar el cliente: ' + mensaje);
    }
}

/**
 * Inicializa los eventos del formulario
 */
function inicializarEventos() {
    if (btnGuardarCliente) {
        btnGuardarCliente.addEventListener('click', guardarCliente);
    }

    const modalElement = document.getElementById('addClienteModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            formAgregarCliente.removeAttribute('data-edit-id');
            document.getElementById('addClienteModalLabel').textContent = 'Añadir Nuevo Cliente';
            formAgregarCliente.reset();
        });
    }

    // Funciones auxiliares locales para evitar contaminar el ámbito global
    const obtenerFechaHoy = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const renderPedidos = async () => {
        if (!tablaPedidosClienteBody || !currentClienteId) return;
        
        tablaPedidosClienteBody.innerHTML = '<tr><td colspan="3" class="text-center text-secondary py-3"><i class="fas fa-spinner fa-spin me-2"></i> Cargando pedidos...</td></tr>';
        
        try {
            const fechaMinVal = inputFechaMin ? inputFechaMin.value : '';
            const fechaMaxVal = inputFechaMax ? inputFechaMax.value : '';
            
            const url = `/ventas/cliente/${currentClienteId}?fechaMin=${fechaMinVal}&fechaMax=${fechaMaxVal}&limit=100`;
            const respuesta = await apiClient.get(url);
            
            if (!respuesta || !respuesta.data) {
                tablaPedidosClienteBody.innerHTML = '<tr><td colspan="3" class="text-center text-warning py-3">Respuesta inválida del servidor</td></tr>';
                return;
            }
            
            const ventas = respuesta.data;
            tablaPedidosClienteBody.innerHTML = '';
            
            if (ventas.length === 0) {
                tablaPedidosClienteBody.innerHTML = '<tr><td colspan="3" class="text-center text-secondary py-3">No se encontraron pedidos en este rango de fechas</td></tr>';
                return;
            }
            
            ventas.forEach(venta => {
                const tr = document.createElement('tr');
                tr.className = 'border-bottom';
                tr.style.borderColor = 'var(--border-color)';
                tr.innerHTML = `
                    <td class="py-3 text-white" style="font-weight: 500;">${venta.fechaEmision || 'N/A'}</td>
                    <td class="py-3 text-secondary">${(venta.empleadoNombre || venta.empleadoApellido) ? `${venta.empleadoNombre || ''} ${venta.empleadoApellido || ''}`.trim() : 'N/A'}</td>
                    <td class="py-3" style="color: #60a5fa; font-weight: 600;">$${Number(venta.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                `;
                tablaPedidosClienteBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error al cargar pedidos del cliente:', error);
            tablaPedidosClienteBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-3"><i class="fas fa-exclamation-circle me-2"></i> Error: ${error.message || 'Error al conectar con el servidor'}</td></tr>`;
        }
    };

    if (verPedidosModalElement) {
        verPedidosModalElement.addEventListener('show.bs.modal', async () => {
            const label = document.getElementById('verPedidosModalLabel');
            if (label) {
                label.textContent = `Pedidos de: ${currentClienteNombre || ''}`;
            }
            
            const hoy = obtenerFechaHoy();
            if (inputFechaMin) inputFechaMin.value = hoy;
            if (inputFechaMax) inputFechaMax.value = hoy;
            
            await renderPedidos();
        });
    }

    if (inputFechaMin) {
        inputFechaMin.addEventListener('change', renderPedidos);
    }
    
    if (inputFechaMax) {
        inputFechaMax.addEventListener('change', renderPedidos);
    }

    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', async () => {
            const hoy = obtenerFechaHoy();
            if (inputFechaMin) inputFechaMin.value = hoy;
            if (inputFechaMax) inputFechaMax.value = hoy;
            await renderPedidos();
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
        inicializarEventos();
    }
});
