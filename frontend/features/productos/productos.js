import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaProductos = null;
let formAgregarProducto = null;
let btnGuardarProducto = null;
let modalAgregarProducto = null;

// Service local para productos
const productosService = {
    getAll: () => apiClient.get('/products'),
    getById: (id) => apiClient.get(`/products/${id}`),
    create: (productData) => apiClient.post('/products', productData),
    update: (id, productData) => apiClient.put(`/products/${id}`, productData),
    delete: (id) => apiClient.delete(`/products/${id}`),
};

/**
 * Inicializa los elementos del DOM
 */
function inicializarElementos() {
    tablaProductos = document.querySelector('tbody');
    formAgregarProducto = document.getElementById('addProductForm');
    btnGuardarProducto = document.querySelector('#addProductModal .modal-footer .btn-primary');
    
    if (!tablaProductos) {
        console.error('No se encontró la tabla de productos');
        return false;
    }
    
    if (btnGuardarProducto) {
        modalAgregarProducto = new bootstrap.Modal(document.getElementById('addProductModal'));
    }
    
    return true;
}

/**
 * Carga todos los productos del backend y renderiza la tabla
 */
async function cargarProductos() {
    try {
        console.log('Cargando productos...');
        const respuesta = await productosService.getAll();
        
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta inválida:', respuesta);
            alert('Error: respuesta inválida del servidor');
            return;
        }
        
        const productos = respuesta.data;
        console.log('Productos cargados:', productos);

        // Limpiar la tabla
        tablaProductos.innerHTML = '';

        if (productos.length === 0) {
            tablaProductos.innerHTML = '<tr><td colspan="3" class="text-center">No hay productos</td></tr>';
            return;
        }

        // Renderizar cada producto
        productos.forEach(producto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${producto.nombre || 'N/A'}</td>
                <td>${producto.marca || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${producto.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm action-btn delete border-0 btn-eliminar" data-id="${producto.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tablaProductos.appendChild(fila);
        });

        // Agregar eventos a los botones
        agregarEventosTabla();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        tablaProductos.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error: ${error.message}</td></tr>`;
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
            await eliminarProducto(id);
        });
    });

    // Eventos para editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            console.log('Editar producto:', id);
            try {
                // Obtener datos básicos del producto
                const producto = await productosService.getById(id);
                document.getElementById('productoNombre').value = producto.nombre || '';
                document.getElementById('productoMarca').value = producto.marca || '';
                document.getElementById('productoCosto').value = producto.costo || '';
                
                // Limpiar inputs de precio
                for (let i = 1; i <= 8; i++) {
                    const input = document.getElementById(`precioLista${i}`);
                    if (input) input.value = '';
                }

                // Obtener precios
                try {
                    const respuestaPrecios = await apiClient.get(`/prices/product/${id}`);
                    if (respuestaPrecios && Array.isArray(respuestaPrecios)) {
                        respuestaPrecios.forEach(price => {
                            const input = document.getElementById(`precioLista${price.listaPrecioId}`);
                            if (input) {
                                input.value = price.precio;
                            }
                        });
                    }
                } catch (errPrice) {
                    console.error('Error al cargar precios del producto:', errPrice);
                }

                formAgregarProducto.setAttribute('data-edit-id', id);
                document.getElementById('addProductModalLabel').textContent = 'Editar Producto';
                modalAgregarProducto.show();
            } catch (error) {
                console.error('Error al cargar datos del producto:', error);
                alert('Error al cargar datos del producto');
            }
        });
    });
}

/**
 * Elimina un producto con confirmación
 */
async function eliminarProducto(id) {
    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
    }

    try {
        console.log('Eliminando producto:', id);
        const respuesta = await productosService.delete(id);
        console.log('Respuesta de eliminación:', respuesta);
        alert('Producto eliminado exitosamente');
        await cargarProductos(); // Recargar la tabla
    } catch (error) {
        console.error('Error completo:', error);
        console.error('Status:', error.status);
        console.error('Data:', error.data);
        const mensaje = error.data?.mensaje || error.data?.error || error.message || 'Error desconocido';
        alert('Error al eliminar el producto: ' + mensaje);
    }
}

/**
 * Maneja la creación de un nuevo producto
 */
async function guardarProducto() {
    const nombre = document.getElementById('productoNombre').value.trim();
    const marca = document.getElementById('productoMarca').value.trim();
    const costo = parseFloat(document.getElementById('productoCosto').value);

    // Validar campos obligatorios
    if (!nombre || !marca || isNaN(costo)) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    // Obtener precios
    const precios = [];
    for (let i = 1; i <= 8; i++) {
        const val = parseFloat(document.getElementById(`precioLista${i}`).value);
        if (!isNaN(val)) {
            precios.push({ listaPrecioId: i, precio: val });
        }
    }

    try {
        const editId = formAgregarProducto.getAttribute('data-edit-id');
        if (editId) {
            console.log('Actualizando producto:', editId, { nombre, marca, costo, precios });
            await productosService.update(editId, {
                nombre,
                marca,
                costo,
                precios
            });
            alert('Producto actualizado exitosamente');
            formAgregarProducto.removeAttribute('data-edit-id');
        } else {
            console.log('Creando producto:', { nombre, marca, costo, precios });
            await productosService.create({
                nombre,
                marca,
                costo,
                precios
            });
            alert('Producto creado exitosamente');
        }

        formAgregarProducto.reset();
        modalAgregarProducto.hide();
        await cargarProductos(); // Recargar la tabla
    } catch (error) {
        console.error('Error al guardar producto:', error);
        const mensaje = error.data?.errores?.[0] || error.data?.mensaje || error.message;
        alert('Error al guardar el producto: ' + mensaje);
    }
}

/**
 * Inicializa los eventos del formulario
 */
function inicializarEventos() {
    if (btnGuardarProducto) {
        btnGuardarProducto.addEventListener('click', guardarProducto);
    }

    const modalElement = document.getElementById('addProductModal');
    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            formAgregarProducto.removeAttribute('data-edit-id');
            document.getElementById('addProductModalLabel').textContent = 'Añadir Nuevo Producto';
            formAgregarProducto.reset();
        });
    }
}

/**
 * Inicializa la página
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página cargada, inicializando...');
    
    if (inicializarElementos()) {
        cargarProductos();
        inicializarEventos();
    }
});
