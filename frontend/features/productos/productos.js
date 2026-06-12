import { apiClient } from '../../api/apiClient.js';

// Elementos del DOM
let tablaProductos = null;
let formAgregarProducto = null;
let btnGuardarProducto = null;
let modalAgregarProducto = null;

// Modal Editar Producto
let editProductModal = null;
let modalEditarProducto = null;
let btnActualizarProducto = null;

// Service local para productos
const productosService = {
    getAll: () => apiClient.get('/products'),
    getById: (id) => apiClient.get(`/products/${id}`),
    create: (productData) => apiClient.post('/products', productData),
    update: (id, productData) => apiClient.put(`/products/${id}`, productData),
    delete: (id) => apiClient.delete(`/products/${id}`),
    
    // Gestión de precios
    getPricesByProduct: (productId) => apiClient.get(`/prices/product/${productId}`),
    createPrice: (priceData) => apiClient.post('/prices', priceData),
    updatePrice: (id, priceData) => apiClient.put(`/prices/${id}`, priceData),
    deletePrice: (id) => apiClient.delete(`/prices/${id}`),
};

/**
 * Inicializa los elementos del DOM
 */
function inicializarElementos() {
    tablaProductos = document.querySelector('tbody');
    formAgregarProducto = document.getElementById('addProductForm');
    btnGuardarProducto = document.querySelector('#addProductModal .modal-footer .btn-primary');
    
    // Modal Editar
    editProductModal = document.getElementById('editProductModal');
    btnActualizarProducto = document.getElementById('btnActualizarProducto');

    if (!tablaProductos) {
        console.error('No se encontró la tabla de productos');
        return false;
    }
    
    if (btnGuardarProducto) {
        modalAgregarProducto = new bootstrap.Modal(document.getElementById('addProductModal'));
    }

    if (editProductModal) {
        modalEditarProducto = new bootstrap.Modal(editProductModal);
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
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${producto.id}" data-bs-toggle="modal" data-bs-target="#editProductModal" title="Editar">
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
        const resp = await productosService.create({
            nombre,
            marca,
            costo
        });

        const newProductId = resp.id;

        // Guardar precios de lista
        for (let i = 1; i <= 8; i++) {
            const valStr = document.getElementById(`precioLista${i}`).value;
            if (valStr && valStr.trim() !== '') {
                const precio = parseFloat(valStr);
                if (!isNaN(precio)) {
                    await productosService.createPrice({
                        precio,
                        productId: newProductId,
                        listaPreciosId: i
                    });
                }
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
 * Maneja la actualización de un producto existente
 */
async function actualizarProducto() {
    const id = document.getElementById('editProductId').value;
    const nombre = document.getElementById('editProductoNombre').value.trim();
    const marca = document.getElementById('editProductoMarca').value.trim();
    const costo = parseFloat(document.getElementById('editProductoCosto').value);

    // Validar campos obligatorios
    if (!nombre || !marca || isNaN(costo)) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    try {
        console.log('Actualizando producto:', { id, nombre, marca, costo });
        await productosService.update(id, {
            nombre,
            marca,
            costo
        });

        // Obtener precios existentes
        const respPrecios = await productosService.getPricesByProduct(id);
        const preciosExistentes = Array.isArray(respPrecios) ? respPrecios : (respPrecios?.data || []);

        // Sincronizar precios de lista 1 a 8
        for (let i = 1; i <= 8; i++) {
            const valStr = document.getElementById(`editPrecioLista${i}`).value.trim();
            const precio = valStr !== '' ? parseFloat(valStr) : NaN;

            // Encontrar si ya existe precio para esta lista
            const precioExistente = preciosExistentes.find(p => p.listaPreciosId === i);

            if (!isNaN(precio)) {
                if (precioExistente) {
                    // Si cambió el precio, actualizarlo
                    if (parseFloat(precioExistente.precio) !== precio) {
                        await productosService.updatePrice(precioExistente.id, {
                            precio,
                            productId: id,
                            listaPreciosId: i
                        });
                    }
                } else {
                    // Si no existía, crearlo
                    await productosService.createPrice({
                        precio,
                        productId: id,
                        listaPreciosId: i
                    });
                }
            } else {
                // Si el input está vacío pero existía el registro de precio, eliminarlo
                if (precioExistente) {
                    await productosService.deletePrice(precioExistente.id);
                }
            }
        }

        alert('Producto actualizado exitosamente');
        modalEditarProducto.hide();
        await cargarProductos(); // Recargar la tabla
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        alert('Error al actualizar el producto: ' + error.message);
    }
}

/**
 * Inicializa los eventos del formulario y modales
 */
function inicializarEventos() {
    if (btnGuardarProducto) {
        btnGuardarProducto.addEventListener('click', guardarProducto);
    }

    if (btnActualizarProducto) {
        btnActualizarProducto.addEventListener('click', actualizarProducto);
    }

    if (editProductModal) {
        // Cargar datos al abrir modal de edición
        editProductModal.addEventListener('show.bs.modal', async (event) => {
            const button = event.relatedTarget;
            const id = button.getAttribute('data-id');

            // Limpiar inputs de precios primero
            for (let i = 1; i <= 8; i++) {
                document.getElementById(`editPrecioLista${i}`).value = '';
            }

            try {
                // Cargar producto
                const producto = await productosService.getById(id);
                document.getElementById('editProductId').value = producto.id;
                document.getElementById('editProductoNombre').value = producto.nombre || '';
                document.getElementById('editProductoMarca').value = producto.marca || '';
                document.getElementById('editProductoCosto').value = producto.costo || 0;

                // Cargar precios de lista
                const respPrecios = await productosService.getPricesByProduct(id);
                const precios = Array.isArray(respPrecios) ? respPrecios : (respPrecios?.data || []);
                
                precios.forEach(p => {
                    const input = document.getElementById(`editPrecioLista${p.listaPreciosId}`);
                    if (input) {
                        input.value = p.precio;
                    }
                });
            } catch (error) {
                console.error('Error al cargar datos del producto para editar:', error);
                alert('Error al cargar datos del producto: ' + error.message);
            }
        });
    }

    // Resetear formulario de creación al cerrar
    const addModalEl = document.getElementById('addProductModal');
    if (addModalEl) {
        addModalEl.addEventListener('hidden.bs.modal', () => {
            formAgregarProducto.reset();
        });
    }
}

/**
 * Inicializa la página
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página de productos cargada, inicializando...');
    
    if (inicializarElementos()) {
        cargarProductos();
        inicializarEventos();
    }
});
