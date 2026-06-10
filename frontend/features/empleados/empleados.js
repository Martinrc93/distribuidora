import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaEmpleados = null;
let formAgregarEmpleado = null;
let btnGuardarEmpleado = null;
let modalAgregarEmpleado = null;

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
    
    return true;
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
            const estadoBadge = empleado.active 
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-secondary">Inactivo</span>';
            
            const nombreCompleto = `${empleado.nombre || 'N/A'} ${empleado.apellido || 'N/A'}`;
            
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${nombreCompleto}</td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-sm" style="font-size: 0.75rem; border-radius: 6px; padding: 0.3rem 0.6rem; background-color: rgba(37, 99, 235, 0.15); color: #60a5fa; border: 1px solid rgba(37, 99, 235, 0.3); transition: all 0.3s ease;" disabled>Ver Pedidos</button>
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
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            // TODO: Implementar edición
            console.log('Editar empleado:', id);
            alert('La función de edición aún no está implementada');
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
        console.error('Status:', error.status);
        console.error('Data:', error.data);
        const mensaje = error.data?.mensaje || error.data?.error || error.message || 'Error desconocido';
        alert('Error al eliminar el empleado: ' + mensaje);
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
        alert('Por favor completa el nombre y apellido del empleado');
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

        alert('Empleado creado exitosamente');
        formAgregarEmpleado.reset();
        modalAgregarEmpleado.hide();
        await cargarEmpleados(); // Recargar la tabla
    } catch (error) {
        console.error('Error al crear empleado:', error);
        const mensaje = error.data?.errores?.[0] || error.message;
        alert('Error al crear el empleado: ' + mensaje);
    }
}

/**
 * Inicializa los eventos del formulario
 */
function inicializarEventos() {
    if (btnGuardarEmpleado) {
        btnGuardarEmpleado.addEventListener('click', guardarEmpleado);
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
