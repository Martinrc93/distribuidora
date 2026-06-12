import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaEmpleados = null;
let formAgregarEmpleado = null;
let btnGuardarEmpleado = null;
let modalAgregarEmpleado = null;

// Elementos del modal Ver Pedidos
let verPedidosModalElement = null;
let modalVerPedidos = null;
let tablaPedidosEmpleadoBody = null;
let inputFechaMin = null;
let inputFechaMax = null;
let btnLimpiarFiltros = null;
let currentEmpleadoId = null;
let currentEmpleadoNombre = '';

// Service local para empleados
const empleadosService = {
    getAll: () => apiClient.get('/empleados'),
    getById: (id) => apiClient.get(`/empleados/${id}`),
    create: (empleadoData) => apiClient.post('/empleados', empleadoData),
    update: (id, empleadoData) => apiClient.put(`/empleados/${id}`, empleadoData),
    delete: (id) => apiClient.delete(`/empleados/${id}`),
};

/**
 * Inicializa los elementos del DOM
 */
function inicializarElementos() {
    tablaEmpleados = document.querySelector('tbody');
    formAgregarEmpleado = document.getElementById('addEmpleadoForm');
    btnGuardarEmpleado = document.querySelector('#addEmpleadoModal .modal-footer .btn-primary');
    
    if (!tablaEmpleados) {
        console.error('No se encontró la tabla de empleados');
        return false;
    }
    
    if (btnGuardarEmpleado) {
        modalAgregarEmpleado = new bootstrap.Modal(document.getElementById('addEmpleadoModal'));
    }
    
    // Inicializar elementos de Ver Pedidos
    verPedidosModalElement = document.getElementById('verPedidosModal');
    if (verPedidosModalElement) {
        modalVerPedidos = new bootstrap.Modal(verPedidosModalElement);
        tablaPedidosEmpleadoBody = document.getElementById('tablaPedidosEmpleadoBody');
        inputFechaMin = document.getElementById('filtroFechaMin');
        inputFechaMax = document.getElementById('filtroFechaMax');
        btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
    }
    
    return true;
}

/**
 * Carga todos los empleados del backend y renderiza la tabla
 */
async function cargarEmpleados() {
    try {
        console.log('Cargando empleados...');
        // El backend devuelve paginación, la lista real está en respuesta.data
        const respuesta = await empleadosService.getAll();
        
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta inválida:', respuesta);
            alert('Error: respuesta inválida del servidor');
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
            const nombreCompleto = `${empleado.nombre || 'N/A'} ${empleado.apellido || 'N/A'}`;
            
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${nombreCompleto}</td>
                <td>
                    <button class="btn btn-sm btn-ver-pedidos" data-bs-toggle="modal" data-bs-target="#verPedidosModal" data-id="${empleado.id}" data-nombre="${nombreCompleto}" style="font-size: 0.75rem; border-radius: 6px; padding: 0.3rem 0.6rem; background-color: rgba(37, 99, 235, 0.15); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.3); transition: all 0.3s ease;">Ver Pedidos</button>
                </td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${empleado.id}" title="Editar">
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

    // Eventos para editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            console.log('Editar empleado:', id);
            try {
                const empleado = await empleadosService.getById(id);
                document.getElementById('empleadoNombre').value = empleado.nombre || '';
                document.getElementById('empleadoApellido').value = empleado.apellido || '';
                
                formAgregarEmpleado.setAttribute('data-edit-id', id);
                document.getElementById('addEmpleadoModalLabel').textContent = 'Editar Empleado';
                modalAgregarEmpleado.show();
            } catch (error) {
                console.error('Error al cargar datos del empleado:', error);
                alert('Error al cargar datos del empleado');
            }
        });
    });
}

/**
 * Elimina un empleado con confirmación
 */
async function eliminarEmpleado(id) {
    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado? Se eliminarán también sus ventas asociadas.')) {
        return;
    }

    try {
        console.log('Eliminando empleado:', id);
        const respuesta = await empleadosService.delete(id);
        console.log('Respuesta de eliminación:', respuesta);
        alert('Empleado eliminado exitosamente');
        await cargarEmpleados(); // Recargar la tabla
    } catch (error) {
        console.error('Error completo:', error);
        const mensaje = error.data?.mensaje || error.data?.error || error.message || 'Error desconocido';
        alert('Error al eliminar el empleado: ' + mensaje);
    }
}

/**
 * Carga y renderiza los pedidos filtrados por fecha del empleado actual
 */
async function renderPedidosFiltered() {
    if (!currentEmpleadoId) return;
    
    const minDate = inputFechaMin ? inputFechaMin.value : '';
    try {
        console.log(`Cargando pedidos para empleado ${currentEmpleadoId} en el día ${minDate}`);
        const url = `/ventas/empleado/${currentEmpleadoId}?dia=${minDate}&limit=100`;
        const response = await apiClient.get(url);
        
        if (!response || !response.data) {
            console.error('Respuesta de pedidos inválida:', response);
            return;
        }

        const pedidos = response.data;
        tablaPedidosEmpleadoBody.innerHTML = '';

        if (pedidos.length === 0) {
            tablaPedidosEmpleadoBody.innerHTML = `
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
                <td class="text-white">$${p.total.toFixed(2)}</td>
            `;
            tablaPedidosEmpleadoBody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error al cargar pedidos del empleado:', error);
        tablaPedidosEmpleadoBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-danger py-3">Error al cargar pedidos: ${error.message}</td>
            </tr>
        `;
    }
}

/**
 * Maneja la creación o edición de un empleado
 */
async function guardarEmpleado() {
    const nombre = document.getElementById('empleadoNombre').value.trim();
    const apellido = document.getElementById('empleadoApellido').value.trim();

    // Validar campos obligatorios
    if (!nombre || !apellido) {
        alert('Por favor completa el nombre y apellido del empleado');
        return;
    }

    try {
        const editId = formAgregarEmpleado.getAttribute('data-edit-id');
        if (editId) {
            console.log('Actualizando empleado:', editId, { nombre, apellido });
            await empleadosService.update(editId, { nombre, apellido });
            alert('Empleado actualizado exitosamente');
            formAgregarEmpleado.removeAttribute('data-edit-id');
        } else {
            console.log('Creando empleado:', { nombre, apellido });
            await empleadosService.create({
                nombre,
                apellido
            });
            alert('Empleado creado exitosamente');
        }

        formAgregarEmpleado.reset();
        modalAgregarEmpleado.hide();
        await cargarEmpleados(); // Recargar la tabla
    } catch (error) {
        console.error('Error al guardar empleado:', error);
        const mensaje = error.data?.errores?.[0] || error.data?.mensaje || error.message;
        alert('Error al guardar el empleado: ' + mensaje);
    }
}

/**
 * Inicializa los eventos del formulario y filtros
 */
function inicializarEventos() {
    if (btnGuardarEmpleado) {
        btnGuardarEmpleado.addEventListener('click', guardarEmpleado);
    }

    const modalElement = document.getElementById('addEmpleadoModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            formAgregarEmpleado.removeAttribute('data-edit-id');
            document.getElementById('addEmpleadoModalLabel').textContent = 'Añadir Nuevo Empleado';
            formAgregarEmpleado.reset();
        });
    }

    if (verPedidosModalElement) {
        // Cuando se abre el modal, establecer el empleado actual y la fecha de hoy
        verPedidosModalElement.addEventListener('show.bs.modal', async (event) => {
            const button = event.relatedTarget;
            currentEmpleadoId = button.dataset.id;
            currentEmpleadoNombre = button.dataset.nombre;
            
            const modalTitle = document.getElementById('verPedidosModalLabel');
            if (modalTitle) {
                modalTitle.textContent = `Pedidos de ${currentEmpleadoNombre}`;
            }

            // Por defecto, establecer la fecha de hoy en formato YYYY-MM-DD (hora local de la máquina)
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            
            if (inputFechaMin) inputFechaMin.value = todayStr;
            if (inputFechaMax) inputFechaMax.value = todayStr;

            await renderPedidosFiltered();
        });

        // Escuchar cambios en los inputs de fecha
        if (inputFechaMin) {
            inputFechaMin.addEventListener('change', async () => {
                if (inputFechaMax) inputFechaMax.value = inputFechaMin.value;
                await renderPedidosFiltered();
            });
        }
        if (inputFechaMax) {
            inputFechaMax.addEventListener('change', async () => {
                if (inputFechaMin) inputFechaMin.value = inputFechaMax.value;
                await renderPedidosFiltered();
            });
        }

        // Botón para volver a "Hoy"
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', async () => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;
                
                if (inputFechaMin) inputFechaMin.value = todayStr;
                if (inputFechaMax) inputFechaMax.value = todayStr;
                
                await renderPedidosFiltered();
            });
        }
    }
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
