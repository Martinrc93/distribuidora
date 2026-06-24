import { apiClient } from '../../api/apiClient.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast, showCustomConfirm } from '../../utils/ui.js';

// Elementos del DOM
let tablaProductos = null;
let formAgregarProducto = null;
let btnGuardarProducto = null;
let modalAgregarProducto = null;

// Modal Editar Producto
let editProductModal = null;
let modalEditarProducto = null;
let btnActualizarProducto = null;

// Modal Gestión de Marcas
let brandModalEl = null;
let modalBrand = null;
let formAgregarBrand = null;
let listBrand = null;

let ultimaMarcaSeleccionada = '';

// Service local para productos
const productosService = {
    getAll: (page = 1, limit = 10, q = '') => apiClient.get(`/products?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`),
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

// Service local para marcas
const marcasService = {
    getAll: () => apiClient.get('/marcas/all'),
    create: (brandData) => apiClient.post('/marcas', brandData),
    update: (id, brandData) => apiClient.put(`/marcas/${id}`, brandData),
    delete: (id) => apiClient.delete(`/marcas/${id}`)
};

// Variables de paginación
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 10;

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

    // Modal Gestión de Marcas
    brandModalEl = document.getElementById('brandModal');
    formAgregarBrand = document.getElementById('addBrandForm');
    listBrand = document.getElementById('brandList');

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

    if (brandModalEl) {
        modalBrand = new bootstrap.Modal(brandModalEl);
    }
    
    return true;
}

/**
 * Carga todos los productos del backend y renderiza la tabla
 * @param {number} page Número de página a cargar.
 */
async function cargarProductos(page = 1) {
    try {
        const searchInput = document.getElementById('productSearchInput');
        const q = searchInput ? searchInput.value.trim() : '';

        console.log('Cargando productos, página:', page, 'búsqueda:', q);
        const respuesta = await productosService.getAll(page, itemsPerPage, q);
        
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta inválida:', respuesta);
            showToast('Error: respuesta inválida del servidor', 'error');
            return;
        }
        
        const productos = respuesta.data;
        currentPage = respuesta.paginaActual || page;
        totalPages = respuesta.paginas || 1;
        const totalItems = respuesta.total || 0;
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
                <td>${escapeHtml(producto.nombre) || 'N/A'}</td>
                <td>${escapeHtml(producto.marca) || 'N/A'}</td>
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

        // Renderizar controles de paginación
        renderPaginationControls(totalItems);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        tablaProductos.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error: ${escapeHtml(error.message)}</td></tr>`;
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
 * Renderiza los controles de paginación
 * @param {number} totalItems Cantidad total de productos en la base de datos
 */
function renderPaginationControls(totalItems) {
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationList = document.getElementById('paginationList');
    if (!paginationInfo || !paginationList) return;

    // Actualizar texto informativo
    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    paginationInfo.textContent = totalItems > 0 
        ? `Mostrando ${startItem}-${endItem} de ${totalItems} productos`
        : 'Mostrando 0-0 de 0 productos';

    // Limpiar botones
    paginationList.innerHTML = '';

    // Botón Anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<button class="page-link" aria-label="Anterior" type="button"><i class="fas fa-chevron-left"></i></button>`;
    if (currentPage > 1) {
        prevLi.querySelector('button').addEventListener('click', () => cargarProductos(currentPage - 1));
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
            pageLi.querySelector('button').addEventListener('click', () => cargarProductos(i));
        }
        paginationList.appendChild(pageLi);
    }

    // Botón Siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<button class="page-link" aria-label="Siguiente" type="button"><i class="fas fa-chevron-right"></i></button>`;
    if (currentPage < totalPages) {
        nextLi.querySelector('button').addEventListener('click', () => cargarProductos(currentPage + 1));
    }
    paginationList.appendChild(nextLi);
}

/**
 * Elimina un producto con confirmación
 */
async function eliminarProducto(id) {
    // Confirmar eliminación
    const confirmado = await showCustomConfirm('¿Estás seguro de que deseas eliminar este producto?');
    if (!confirmado) {
        return;
    }

    try {
        console.log('Eliminando producto:', id);
        const respuesta = await productosService.delete(id);
        console.log('Respuesta de eliminación:', respuesta);
        showToast('Producto eliminado exitosamente');
        await cargarProductos(currentPage); // Recargar la tabla en la página actual
    } catch (error) {
        console.error('Error completo:', error);
        const mensaje = error.data?.mensaje || error.data?.error || error.message || 'Error desconocido';
        showToast('Error al eliminar el producto: ' + mensaje, 'error');
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
        showToast('Por favor completa todos los campos obligatorios', 'error');
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
        for (const lista of listasPrecios) {
            const input = document.getElementById(`precioLista${lista.id}`);
            const valStr = input ? input.value : '';
            if (valStr && valStr.trim() !== '') {
                const precio = parseFloat(valStr);
                if (!isNaN(precio)) {
                    await productosService.createPrice({
                        precio,
                        productId: newProductId,
                        listaPreciosId: lista.id
                    });
                }
            }
        }

        showToast('Producto creado exitosamente');
        ultimaMarcaSeleccionada = marca;
        formAgregarProducto.reset();
        modalAgregarProducto.hide();
        await cargarProductos(); // Recargar la tabla
    } catch (error) {
        console.error('Error al crear producto:', error);
        showToast('Hubo un error al crear el producto.', 'error');
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
        showToast('Por favor completa todos los campos obligatorios', 'error');
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

        // Sincronizar precios de lista dinámicamente
        for (const lista of listasPrecios) {
            const input = document.getElementById(`editPrecioLista${lista.id}`);
            const valStr = input ? input.value.trim() : '';
            const precio = valStr !== '' ? parseFloat(valStr) : NaN;

            // Encontrar si ya existe precio para esta lista
            const precioExistente = preciosExistentes.find(p => p.listaPreciosId === lista.id);

            if (!isNaN(precio)) {
                if (precioExistente) {
                    // Si cambió el precio, actualizarlo
                    if (parseFloat(precioExistente.precio) !== precio) {
                        await productosService.updatePrice(precioExistente.id, {
                            precio,
                            productId: id,
                            listaPreciosId: lista.id
                        });
                    }
                } else {
                    // Si no existía, crearlo
                    await productosService.createPrice({
                        precio,
                        productId: id,
                        listaPreciosId: lista.id
                    });
                }
            } else {
                // Si el input está vacío pero existía el registro de precio, eliminarlo
                if (precioExistente) {
                    await productosService.deletePrice(precioExistente.id);
                }
            }
        }

        showToast('Producto actualizado exitosamente');
        modalEditarProducto.hide();
        await cargarProductos(); // Recargar la tabla
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        showToast('Hubo un error al actualizar el producto.', 'error');
    }
}

/**
 * Carga todas las marcas y las renderiza en la lista
 */
async function cargarMarcas() {
    try {
        console.log('Cargando marcas...');
        listBrand.innerHTML = '<li class="list-group-item text-center text-secondary py-3"><i class="fas fa-spinner fa-spin"></i> Cargando...</li>';
        
        const marcas = await marcasService.getAll();
        const listaMarcas = Array.isArray(marcas) ? marcas : (marcas?.data || []);
        
        listBrand.innerHTML = '';
        if (listaMarcas.length === 0) {
            listBrand.innerHTML = '<li class="list-group-item text-center text-secondary py-3">No hay marcas registradas</li>';
            return;
        }

        listaMarcas.forEach(marca => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerHTML = `
                <span class="brand-name-span">${escapeHtml(marca.nombre)}</span>
                <div class="brand-actions">
                    <button class="btn btn-sm action-btn border-0 btn-editar-marca" data-id="${marca.id}" title="Editar Marca">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm action-btn delete border-0 btn-eliminar-marca" data-id="${marca.id}" title="Eliminar Marca">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            listBrand.appendChild(li);
        });

        // Agregar listener de click a los botones de eliminar
        listBrand.querySelectorAll('.btn-eliminar-marca').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                await eliminarMarca(id);
            });
        });

        // Agregar listener de click a los botones de editar
        listBrand.querySelectorAll('.btn-editar-marca').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const li = btn.closest('.list-group-item');
                const spanName = li.querySelector('.brand-name-span');
                const currentName = spanName.textContent.trim();

                // Cambiar a modo edición
                li.innerHTML = `
                    <input type="text" class="form-control form-control-sm brand-edit-input" value="${escapeHtml(currentName)}">
                    <div class="brand-actions">
                        <button class="btn btn-sm action-btn save border-0 btn-guardar-cambio-marca" title="Guardar"><i class="fas fa-check"></i></button>
                        <button class="btn btn-sm action-btn cancel border-0 btn-cancelar-cambio-marca" title="Cancelar"><i class="fas fa-times"></i></button>
                    </div>
                `;

                // Botón cancelar
                li.querySelector('.btn-cancelar-cambio-marca').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    cargarMarcas(); // Recargar la lista original
                });

                // Botón guardar
                li.querySelector('.btn-guardar-cambio-marca').addEventListener('click', async (ev) => {
                    ev.stopPropagation();
                    const input = li.querySelector('.brand-edit-input');
                    const nuevoNombre = input.value.trim();

                    if (!nuevoNombre) {
                        showToast('El nombre no puede estar vacío.', 'error');
                        return;
                    }

                    try {
                        console.log('Actualizando marca:', id, 'a', nuevoNombre);
                        await marcasService.update(id, { nombre: nuevoNombre });
                        await cargarMarcas(); // Recargar la lista
                        await actualizarSelectsMarcas();
                    } catch (error) {
                        console.error('Error al actualizar marca:', error);
                        showToast('Hubo un error al actualizar la marca.', 'error');
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error al cargar marcas:', error);
        listBrand.innerHTML = `<li class="list-group-item text-center text-danger">Error: ${error.message}</li>`;
    }
}

/**
 * Actualiza los dropdowns personalizados de marcas en los formularios de añadir y editar producto
 */
async function actualizarSelectsMarcas() {
    try {
        console.log('Actualizando dropdowns personalizados de marcas...');
        const marcas = await marcasService.getAll();
        const listaMarcas = Array.isArray(marcas) ? marcas : (marcas?.data || []);

        const containers = [
            { optionsId: 'optionsProductoMarca', inputId: 'productoMarca' },
            { optionsId: 'optionsEditProductoMarca', inputId: 'editProductoMarca' }
        ];

        containers.forEach(({ optionsId, inputId }) => {
            const optionsContainer = document.getElementById(optionsId);
            const input = document.getElementById(inputId);
            if (!optionsContainer) return;

            const valActual = input ? input.value : '';

            optionsContainer.innerHTML = '';
            
            if (listaMarcas.length === 0) {
                optionsContainer.innerHTML = '<div class="custom-select-option no-results">No hay marcas registradas</div>';
                return;
            }

            listaMarcas.forEach(m => {
                const opt = document.createElement('div');
                opt.className = 'custom-select-option';
                if (m.nombre === valActual) {
                    opt.classList.add('selected');
                }
                opt.setAttribute('data-value', m.nombre);
                opt.textContent = m.nombre;
                optionsContainer.appendChild(opt);
            });
        });
    } catch (error) {
        console.error('Error al actualizar selects personalizados de marcas:', error);
    }
}

/**
 * Configura un select autocompletable personalizado
 */
function setupCustomSelect(inputId, optionsContainerId, containerId) {
    const input = document.getElementById(inputId);
    const optionsContainer = document.getElementById(optionsContainerId);
    const container = document.getElementById(containerId);
    
    if (!input || !optionsContainer || !container) return;

    // Toggle dropdown al hacer click o enfocar
    const openDropdown = () => {
        document.querySelectorAll('.custom-select-container').forEach(c => {
            if (c !== container) c.classList.remove('open');
        });
        container.classList.add('open');
    };

    const closeDropdown = () => {
        container.classList.remove('open');
    };

    input.addEventListener('click', (e) => {
        e.stopPropagation();
        openDropdown();
    });

    input.addEventListener('focus', () => {
        openDropdown();
    });

    // Filtrar opciones al escribir
    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        const options = optionsContainer.querySelectorAll('.custom-select-option:not(.no-results)');
        let hasVisible = false;

        options.forEach(opt => {
            const val = opt.getAttribute('data-value').toLowerCase();
            if (val.includes(query)) {
                opt.style.display = 'flex';
                hasVisible = true;
            } else {
                opt.style.display = 'none';
            }
        });

        // Mostrar opción de crear si no hay coincidencia exacta
        let noResultsOpt = optionsContainer.querySelector('.no-results');
        if (!hasVisible && query !== '') {
            if (!noResultsOpt) {
                noResultsOpt = document.createElement('div');
                noResultsOpt.className = 'custom-select-option no-results';
                optionsContainer.appendChild(noResultsOpt);
            }
            noResultsOpt.innerHTML = `<i class="fas fa-plus me-2 text-primary"></i> Usar/Crear "${escapeHtml(input.value.trim())}"`;
            noResultsOpt.style.display = 'flex';
            
            noResultsOpt.onclick = (e) => {
                e.stopPropagation();
                closeDropdown();
            };
        } else {
            if (noResultsOpt) {
                noResultsOpt.style.display = 'none';
            }
        }
    });

    // Selección al hacer click
    optionsContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-select-option');
        if (!option) return;
        
        e.stopPropagation();
        
        if (option.classList.contains('no-results')) {
            closeDropdown();
            return;
        }

        const val = option.getAttribute('data-value');
        input.value = val;
        
        optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');
        
        closeDropdown();
        
        // Disparar evento input por si otros scripts lo escuchan
        input.dispatchEvent(new Event('input'));
    });
}

/**
 * Maneja la creación de una nueva marca
 */
async function guardarMarca(e) {
    if (e) e.preventDefault();
    const nombreInput = document.getElementById('brandNombre');
    const nombre = nombreInput.value.trim();

    if (!nombre) {
        showToast('Por favor introduce el nombre de la marca', 'error');
        return;
    }

    try {
        console.log('Creando marca:', nombre);
        await marcasService.create({ nombre });
        nombreInput.value = '';
        await cargarMarcas(); // Recargar la lista
        await actualizarSelectsMarcas();
        showToast('Marca registrada exitosamente');
    } catch (error) {
        console.error('Error al crear marca:', error);
        showToast('Hubo un error al registrar la marca.', 'error');
    }
}

/**
 * Elimina una marca con confirmación
 */
async function eliminarMarca(id) {
    const confirmado = await showCustomConfirm('¿Estás seguro de que deseas eliminar esta marca?');
    if (!confirmado) {
        return;
    }

    try {
        console.log('Eliminando marca:', id);
        await marcasService.delete(id);
        await cargarMarcas(); // Recargar la lista
        await actualizarSelectsMarcas();
    } catch (error) {
        console.error('Error al eliminar marca:', error);
        const mensaje = error.data?.mensaje || error.data?.error || error.message || 'Error desconocido';
        showToast('No se pudo eliminar la marca. Probablemente esté en uso por algún producto.', 'error');
    }
}

/**
 * Inicializa los eventos del formulario y modales
 */
function inicializarEventos() {
    // Configurar selects personalizados de marcas
    setupCustomSelect('productoMarca', 'optionsProductoMarca', 'containerProductoMarca');
    setupCustomSelect('editProductoMarca', 'optionsEditProductoMarca', 'containerEditProductoMarca');

    // Cerrar select custom al hacer click afuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-select-container')) {
            document.querySelectorAll('.custom-select-container').forEach(c => {
                c.classList.remove('open');
            });
        }
    });

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
            listasPrecios.forEach(lista => {
                const input = document.getElementById(`editPrecioLista${lista.id}`);
                if (input) input.value = '';
            });

            try {
                // Asegurar que las marcas estén al día
                await actualizarSelectsMarcas();

                // Cargar producto
                const producto = await productosService.getById(id);
                document.getElementById('editProductId').value = producto.id;
                document.getElementById('editProductoNombre').value = producto.nombre || '';
                
                const brandVal = producto.marca || '';
                document.getElementById('editProductoMarca').value = brandVal;
                document.getElementById('editProductoCosto').value = producto.costo || 0;

                // Marcar la opción correspondiente en el desplegable
                const optionsContainer = document.getElementById('optionsEditProductoMarca');
                if (optionsContainer) {
                    optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
                        if (opt.getAttribute('data-value') === brandVal) {
                            opt.classList.add('selected');
                        } else {
                            opt.classList.remove('selected');
                        }
                    });
                }

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
                showToast('Hubo un error al cargar los datos del producto.', 'error');
            }
        });
    }

    // Resetear formulario de creación al cerrar
    const addModalEl = document.getElementById('addProductModal');
    if (addModalEl) {
        addModalEl.addEventListener('show.bs.modal', async () => {
            await actualizarSelectsMarcas();
            if (ultimaMarcaSeleccionada) {
                document.getElementById('productoMarca').value = ultimaMarcaSeleccionada;
                const optionsContainer = document.getElementById('optionsProductoMarca');
                if (optionsContainer) {
                    optionsContainer.querySelectorAll('.custom-select-option').forEach(opt => {
                        if (opt.getAttribute('data-value') === ultimaMarcaSeleccionada) {
                            opt.classList.add('selected');
                        } else {
                            opt.classList.remove('selected');
                        }
                    });
                }
            }
        });
        addModalEl.addEventListener('hidden.bs.modal', () => {
            formAgregarProducto.reset();
        });
    }

    if (brandModalEl) {
        // Cargar marcas al abrir el modal
        brandModalEl.addEventListener('show.bs.modal', async () => {
            await cargarMarcas();
        });
    }

    if (formAgregarBrand) {
        formAgregarBrand.addEventListener('submit', guardarMarca);
    }

    // Buscador con Debounce
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                cargarProductos(1);
            }, 300);
        });
    }
}



let listasPrecios = [];

async function inicializarListasPrecios() {
    try {
        const respuesta = await apiClient.get('/lista-precios');
        listasPrecios = Array.isArray(respuesta) ? respuesta : (respuesta?.data || []);
        
        const addPreciosContainer = document.getElementById('addPreciosContainer');
        const editPreciosContainer = document.getElementById('editPreciosContainer');
        
        if (addPreciosContainer && editPreciosContainer) {
            let addHtml = '';
            let editHtml = '';
            
            listasPrecios.forEach((lista, idx) => {
                const isRequired = idx === 0 ? 'required' : '';
                addHtml += `
                    <div class="col-md-3">
                        <label for="precioLista${lista.id}" class="form-label text-secondary">${escapeHtml(lista.nombre)} ($)</label>
                        <input type="number" step="0.01" class="form-control" id="precioLista${lista.id}" ${isRequired}>
                    </div>
                `;
                editHtml += `
                    <div class="col-md-3">
                        <label for="editPrecioLista${lista.id}" class="form-label text-secondary">${escapeHtml(lista.nombre)} ($)</label>
                        <input type="number" step="0.01" class="form-control" id="editPrecioLista${lista.id}" ${isRequired}>
                    </div>
                `;
            });
            
            addPreciosContainer.innerHTML = addHtml;
            editPreciosContainer.innerHTML = editHtml;
        }
    } catch (error) {
        console.error('Error al inicializar listas de precios dinámicas:', error);
        showToast('Error al cargar las listas de precios.', 'error');
    }
}

/**
 * Inicializa la página
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página de productos cargada, inicializando...');
    
    if (inicializarElementos()) {
        await inicializarListasPrecios();
        cargarProductos();
        actualizarSelectsMarcas();
        inicializarEventos();
    }
});
