import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaProductos = null;
let formAgregarProducto = null;
let btnGuardarProducto = null;
let modalAgregarProducto = null;
let formEditarProducto = null;
let btnActualizarProducto = null;
let modalEditarProducto = null;
let preciosActuales = [];

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
    formEditarProducto = document.getElementById('editProductForm');
    btnActualizarProducto = document.getElementById('btnActualizarProducto');
    
    if (!tablaProductos) {
        console.error('No se encontró la tabla de productos');
        return false;
    }
    
    if (btnGuardarProducto) {
        modalAgregarProducto = new bootstrap.Modal(document.getElementById('addProductModal'));
    }
    
    if (btnActualizarProducto) {
        modalEditarProducto = new bootstrap.Modal(document.getElementById('editProductModal'));
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
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            abrirEditarProducto(id);
        });
    });
}

/**
 * Elimina un producto con confirmación
 */
async function eliminarProducto(id) {
    // Confirmar eliminación
    if (!confirm('¿Esta seguro de que desea eliminar este producto?')) {
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

    try {
        console.log('Creando producto:', { nombre, marca, costo });
        const respuesta = await productosService.create({
            nombre,
            marca,
            costo
        });

        const productoId = respuesta.id;

        // Guardar precios de lista 1 a 8 si se ingresaron
        for (let i = 1; i <= 8; i++) {
            const input = document.getElementById(`precioLista${i}`);
            if (input && input.value.trim() !== '') {
                const precioVal = parseFloat(input.value.trim());
                await apiClient.post('/prices', {
                    precio: precioVal,
                    productId: productoId,
                    listaPreciosId: i
                });
            }
        }

        alert('Producto creado exitosamente');
        formAgregarProducto.reset();
        modalAgregarProducto.hide();
        await cargarProductos(); // Recargar la tabla
    } catch (error) {
        console.error('Error al crear producto:', error);
        alert('Error al crear el producto: ' + error.message);
    }
}

/**
 * Abre el modal de edición cargando los datos del producto
 */
async function abrirEditarProducto(id) {
    try {
        console.log('Obteniendo datos del producto:', id);
        const respuesta = await productosService.getById(id);
        
        if (!respuesta) {
            alert('No se pudo cargar la informacion del producto.');
            return;
        }
        
        const producto = respuesta;
        
        document.getElementById('editProductoId').value = producto.id;
        document.getElementById('editProductoNombre').value = producto.nombre || '';
        document.getElementById('editProductoMarca').value = producto.marca || '';
        document.getElementById('editProductoCosto').value = producto.costo || '';

        // Limpiar inputs de precios
        for (let i = 1; i <= 8; i++) {
            const input = document.getElementById(`editPrecioLista${i}`);
            if (input) input.value = '';
        }

        // Consultar precios desde el endpoint GET /prices/product/:productId
        console.log('Obteniendo precios de lista para el producto:', id);
        const pricesRes = await apiClient.get(`/prices/product/${id}`);
        preciosActuales = Array.isArray(pricesRes) ? pricesRes : [];

        // Rellenar inputs de la interfaz
        preciosActuales.forEach(p => {
            const input = document.getElementById(`editPrecioLista${p.listaPreciosId}`);
            if (input) {
                input.value = p.precio;
            }
        });
        
        modalEditarProducto.show();
    } catch (error) {
        console.error('Error al obtener producto:', error);
        alert('Error al cargar la informacion del producto: ' + error.message);
    }
}

/**
 * Maneja la actualización del producto
 */
async function actualizarProducto() {
    const id = document.getElementById('editProductoId').value;
    const nombre = document.getElementById('editProductoNombre').value.trim();
    const marca = document.getElementById('editProductoMarca').value.trim();
    const costo = parseFloat(document.getElementById('editProductoCosto').value);

    // Validar campos obligatorios
    if (!nombre || !marca || isNaN(costo)) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    try {
        console.log('Actualizando producto:', id, { nombre, marca, costo });
        await productosService.update(id, {
            nombre,
            marca,
            costo
        });

        // Actualizar precios de Lista 1 a 8 respetando los endpoints
        for (let i = 1; i <= 8; i++) {
            const input = document.getElementById(`editPrecioLista${i}`);
            if (!input) continue;
            const val = input.value.trim();
            const existing = preciosActuales.find(p => p.listaPreciosId === i);

            if (val !== '') {
                const newPrice = parseFloat(val);
                if (existing) {
                    // Si el precio cambió, llamar a PUT /prices/:id
                    if (parseFloat(existing.precio) !== newPrice) {
                        await apiClient.put(`/prices/${existing.id}`, {
                            precio: newPrice,
                            productId: parseInt(id, 10),
                            listaPreciosId: i
                        });
                    }
                } else {
                    // Si no existía, llamar a POST /prices
                    await apiClient.post('/prices', {
                        precio: newPrice,
                        productId: parseInt(id, 10),
                        listaPreciosId: i
                    });
                }
            } else {
                // Si el input está vacío pero existía un precio, llamar a DELETE /prices/:id
                if (existing) {
                    await apiClient.delete(`/prices/${existing.id}`);
                }
            }
        }

        alert('Producto actualizado exitosamente');
        modalEditarProducto.hide();
        await cargarProductos(); // Recargar la tabla
    } catch (error) {
        console.error('Error al actualizar producto o precios:', error);
        alert('Error al actualizar el producto: ' + error.message);
    }
}

/**
 * Inicializa los eventos del formulario
 */
function inicializarEventos() {
    if (btnGuardarProducto) {
        btnGuardarProducto.addEventListener('click', guardarProducto);
    }
    if (btnActualizarProducto) {
        btnActualizarProducto.addEventListener('click', actualizarProducto);
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
