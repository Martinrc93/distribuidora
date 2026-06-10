import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaClientes = null;
let formAgregarCliente = null;
let btnGuardarCliente = null;
let modalAgregarCliente = null;

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
    
    if (!tablaClientes) {
        console.error('No se encontró la tabla de clientes');
        return false;
    }
    
    if (btnGuardarCliente) {
        modalAgregarCliente = new bootstrap.Modal(document.getElementById('addClienteModal'));
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
                    <button class="btn btn-sm" style="font-size: 0.75rem; border-radius: 6px; padding: 0.3rem 0.6rem; background-color: rgba(37, 99, 235, 0.15); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.3); transition: all 0.3s ease;" disabled>Ver Pedidos</button>
                </td>
                <td>
                    <span class="badge" style="background-color: rgba(37, 99, 235, 0.1); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.25); font-weight: 500; font-size: 0.8rem; padding: 0.35rem 0.65rem; border-radius: 6px;">Lista 1</span>
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
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            // TODO: Implementar edición
            console.log('Editar cliente:', id);
            alert('La función de edición aún no está implementada');
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
 * Maneja la creación de un nuevo cliente
 */
async function guardarCliente() {
    const nombre = document.getElementById('clienteNombre').value.trim();
    const direccion = document.getElementById('clienteDireccion').value.trim();

    // Validar campos obligatorios
    if (!nombre) {
        alert('Por favor completa el nombre del cliente');
        return;
    }

    try {
        console.log('Creando cliente:', { nombre, direccion });
        await clientesService.create({
            nombre,
            direccion
        });

        alert('Cliente creado exitosamente');
        formAgregarCliente.reset();
        modalAgregarCliente.hide();
        await cargarClientes(); // Recargar la tabla
    } catch (error) {
        console.error('Error al crear cliente:', error);
        alert('Error al crear el cliente: ' + error.message);
    }
}

/**
 * Inicializa los eventos del formulario
 */
function inicializarEventos() {
    if (btnGuardarCliente) {
        btnGuardarCliente.addEventListener('click', guardarCliente);
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
