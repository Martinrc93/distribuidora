import { apiClient } from '../../api/apiClient.js';
import { escapeHtml } from '../../utils/sanitize.js';
import { showToast } from '../../utils/ui.js';

function formatCurrency(value) {
    return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sortVentasPorOrdenImpresion(ventasParaOrdenar = []) {
    return [...ventasParaOrdenar].sort((a, b) => {
        const aActivo = Boolean(a.activo);
        const bActivo = Boolean(b.activo);

        if (aActivo !== bActivo) {
            return aActivo ? -1 : 1;
        }

        const aOrden = Number.isFinite(Number(a.ordenImpresion)) ? Number(a.ordenImpresion) : Infinity;
        const bOrden = Number.isFinite(Number(b.ordenImpresion)) ? Number(b.ordenImpresion) : Infinity;

        if (aOrden !== bOrden) {
            return aOrden - bOrden;
        }

        const aFecha = new Date(a.fechaEmision || 0).getTime();
        const bFecha = new Date(b.fechaEmision || 0).getTime();
        if (aFecha !== bFecha) {
            return bFecha - aFecha;
        }

        return Number(b.id || 0) - Number(a.id || 0);
    });
}

function getLocalDateStr() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getRangoFechasFormateado() {
    const fechaMinEl = document.getElementById('fechaMinInput');
    const fechaMaxEl = document.getElementById('fechaMaxInput');
    
    if (fechaMinEl && fechaMinEl.value && fechaMaxEl && fechaMaxEl.value) {
        const minVal = fechaMinEl.value; // YYYY-MM-DD
        const maxVal = fechaMaxEl.value; // YYYY-MM-DD
        
        const formatFecha = (fStr) => {
            const parts = fStr.split('-');
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        };
        
        if (minVal === maxVal) {
            return formatFecha(minVal);
        } else {
            return `${formatFecha(minVal)} - ${formatFecha(maxVal)}`;
        }
    }
    
    const today = new Date();
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
}

let fpMin = null;
let fpMax = null;

function inicializarFiltroFechas() {
    const todayStr = getLocalDateStr();
    
    // Inicializar Flatpickr con idioma español y formato d/m/Y
    fpMin = flatpickr("#fechaMinInput", {
        locale: "es",
        altInput: true,
        altFormat: "d/m/Y",
        dateFormat: "Y-m-d",
        defaultDate: todayStr
    });
    
    fpMax = flatpickr("#fechaMaxInput", {
        locale: "es",
        altInput: true,
        altFormat: "d/m/Y",
        dateFormat: "Y-m-d",
        defaultDate: todayStr
    });
}

let sortableInstance = null;
let currentRenderedVentas = [];

// Elementos del DOM
let tablaPedidos = null;
let formAgregarPedido = null;
let btnAgregarProducto = null;
let tablaPedidoDetallesBody = null;
let pedidoTotalLabel = null;
let btnConfirmarPedido = null;
let modalAgregarPedido = null;

// Modal Ver Detalle de Pedido
let verPedidoModal = null;
let modalVerPedido = null;
let verPedidoCliente = null;
let verPedidoEmpleado = null;
let verPedidoFecha = null;
let verPedidoEstadoBadge = null;
let verPedidoDetallesBody = null;
let verPedidoTotal = null;

// Modal Editar Pedido (Estado y Detalles)
let editPedidoModal = null;
let modalEditarPedido = null;
let btnActualizarPedido = null;
let editPedidoId = null;
let editPedidoEstado = null;
let editPedidoCliente = null;
let editPedidoTotalLabel = null;
let editPedidoDetallesBody = null;
let btnEditAgregarProducto = null;

// Variables de estado
let clientes = [];
let empleados = [];
let productos = [];
let marcas = [];
let ventas = [];
let detallesTemporales = [];
let detallesEdicion = [];
let currentClienteEdicion = null;
let configuracionNegocio = {
    nombre_negocio: 'Distri-Pipipuch',
    info_contacto: 'LORENA 1150222520 - DANIEL 1150222413'
};

/**
 * Inicializa los elementos del DOM y modales de Bootstrap
 */
function inicializarElementos() {
    tablaPedidos = document.querySelector('tbody');
    formAgregarPedido = document.getElementById('addPedidoForm');
    btnAgregarProducto = document.getElementById('btnAgregarProducto');
    tablaPedidoDetallesBody = document.getElementById('pedidoDetallesBody');
    pedidoTotalLabel = document.getElementById('pedidoTotalLabel');
    btnConfirmarPedido = document.querySelector('#addPedidoModal .modal-footer .btn-primary');

    // Details Modal
    verPedidoModal = document.getElementById('verPedidoModal');
    verPedidoCliente = document.getElementById('verPedidoCliente');
    verPedidoEmpleado = document.getElementById('verPedidoEmpleado');
    verPedidoFecha = document.getElementById('verPedidoFecha');
    verPedidoEstadoBadge = document.getElementById('verPedidoEstadoBadge');
    verPedidoDetallesBody = document.getElementById('verPedidoDetallesBody');
    verPedidoTotal = document.getElementById('verPedidoTotal');

    // Edit Modal
    editPedidoModal = document.getElementById('editPedidoModal');
    btnActualizarPedido = document.getElementById('btnActualizarPedido');
    editPedidoId = document.getElementById('editPedidoId');
    editPedidoEstado = document.getElementById('editPedidoEstado');
    editPedidoCliente = document.getElementById('editPedidoCliente');
    editPedidoTotalLabel = document.getElementById('editPedidoTotalLabel');
    editPedidoDetallesBody = document.getElementById('editPedidoDetallesBody');
    btnEditAgregarProducto = document.getElementById('btnEditAgregarProducto');

    if (!tablaPedidos) {
        console.error('No se encontró la tabla de pedidos');
        return false;
    }

    const addModalEl = document.getElementById('addPedidoModal');
    if (addModalEl) {
        modalAgregarPedido = new bootstrap.Modal(addModalEl);
    }

    if (verPedidoModal) {
        modalVerPedido = new bootstrap.Modal(verPedidoModal);
    }

    if (editPedidoModal) {
        modalEditarPedido = new bootstrap.Modal(editPedidoModal);
    }

    return true;
}

/**
 * Carga clientes, empleados y productos necesarios para la interacción
 */
async function cargarDatosAuxiliares() {
    try {
        console.log('Cargando datos auxiliares...');
        const [respClientes, respEmpleados, respProductos, respMarcas, respConfig] = await Promise.all([
            apiClient.get('/clientes?limit=1000'),
            apiClient.get('/empleados'),
            apiClient.get('/products/all'),
            apiClient.get('/marcas/all'),
            apiClient.get('/api/config').catch(err => {
                console.error('Error al cargar config del backend, usando defaults:', err);
                return null;
            })
        ]);

        clientes = respClientes?.data || [];
        empleados = respEmpleados?.data || [];
        productos = Array.isArray(respProductos) ? respProductos : (respProductos?.data || []);
        marcas = Array.isArray(respMarcas) ? respMarcas : (respMarcas?.data || []);

        if (respConfig && respConfig.data) {
            configuracionNegocio = respConfig.data;
        }

        // Inicializar comboboxes de búsqueda interactivos
        inicializarCombobox('pedidoEmpleado', empleados.filter(e => e.activo).map(e => `${e.nombre} ${e.apellido}`));
        inicializarCombobox('pedidoCliente', clientes.map(c => c.nombre), (selectedClientName) => {
            actualizarVisibilidadBtnRepetir();
        });
        inicializarCombobox('editProductoSelect', productos.map(p => p.nombre));

        // Inicializar combobox de marcas con callback para filtrar productos (creación)
        inicializarCombobox('marcaSelect', marcas.map(m => m.nombre), (selectedBrand) => {
            const productInput = document.getElementById('productoSelect');
            if (productInput) {
                productInput.value = '';
                if (!selectedBrand || selectedBrand.trim() === '') {
                    productInput.comboboxOptions = productos.map(p => p.nombre);
                } else {
                    const filtered = productos.filter(p => p.marca === selectedBrand);
                    productInput.comboboxOptions = filtered.map(p => p.nombre);
                }
            }
        });

        // Inicializar combobox de marcas con callback para filtrar productos (edición)
        inicializarCombobox('editMarcaSelect', marcas.map(m => m.nombre), (selectedBrand) => {
            const productInput = document.getElementById('editProductoSelect');
            if (productInput) {
                productInput.value = '';
                if (!selectedBrand || selectedBrand.trim() === '') {
                    productInput.comboboxOptions = productos.map(p => p.nombre);
                } else {
                    const filtered = productos.filter(p => p.marca === selectedBrand);
                    productInput.comboboxOptions = filtered.map(p => p.nombre);
                }
            }
        });

        // Escuchar cuando el input de marca se limpie o modifique manualmente (creación)
        const marcaInput = document.getElementById('marcaSelect');
        if (marcaInput) {
            marcaInput.addEventListener('input', () => {
                const val = marcaInput.value.trim();
                const productInput = document.getElementById('productoSelect');
                if (productInput) {
                    if (val === '') {
                        productInput.comboboxOptions = productos.map(p => p.nombre);
                    } else {
                        const matchedBrand = marcas.find(m => m.nombre.toLowerCase() === val.toLowerCase());
                        if (matchedBrand) {
                            const filtered = productos.filter(p => p.marca.toLowerCase() === matchedBrand.nombre.toLowerCase());
                            productInput.comboboxOptions = filtered.map(p => p.nombre);
                        } else {
                            productInput.comboboxOptions = productos.map(p => p.nombre);
                        }
                    }
                }
            });
        }

        // Escuchar cuando el input de marca se limpie o modifique manualmente (edición)
        const editMarcaInput = document.getElementById('editMarcaSelect');
        if (editMarcaInput) {
            editMarcaInput.addEventListener('input', () => {
                const val = editMarcaInput.value.trim();
                const productInput = document.getElementById('editProductoSelect');
                if (productInput) {
                    if (val === '') {
                        productInput.comboboxOptions = productos.map(p => p.nombre);
                    } else {
                        const matchedBrand = marcas.find(m => m.nombre.toLowerCase() === val.toLowerCase());
                        if (matchedBrand) {
                            const filtered = productos.filter(p => p.marca.toLowerCase() === matchedBrand.nombre.toLowerCase());
                            productInput.comboboxOptions = filtered.map(p => p.nombre);
                        } else {
                            productInput.comboboxOptions = productos.map(p => p.nombre);
                        }
                    }
                }
            });
        }

        // Inicializar combobox de productos
        inicializarCombobox('productoSelect', productos.map(p => p.nombre));

        console.log('Datos auxiliares cargados.');
    } catch (error) {
        console.error('Error al cargar datos auxiliares:', error);
    }
}

/**
 * Recarga la lista de clientes desde el backend para incluir clientes creados recientemente.
 * Se llama al abrir el modal de nuevo pedido para mantener los datos actualizados.
 */
async function recargarClientes() {
    try {
        const respClientes = await apiClient.get('/clientes?limit=1000');
        clientes = respClientes?.data || [];
        // Actualizar las opciones del combobox de clientes
        const pedidoClienteInput = document.getElementById('pedidoCliente');
        if (pedidoClienteInput) {
            pedidoClienteInput.comboboxOptions = clientes.map(c => c.nombre);
        }
    } catch (error) {
        console.error('Error al recargar clientes:', error);
    }
}

/**
 * Carga las ventas/pedidos del backend filtrando por la fecha de hoy
 */
async function cargarVentas(silent = false) {
    try {
        console.log('Cargando pedidos/ventas...');
        if (!silent) {
            tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3"><i class="fas fa-spinner fa-spin"></i> Cargando pedidos...</td></tr>';
        }
        
        const fechaMinEl = document.getElementById('fechaMinInput');
        const fechaMaxEl = document.getElementById('fechaMaxInput');
        
        let url = '/ventas?limit=100';
        if (fechaMinEl && fechaMinEl.value) {
            url += `&fechaMin=${fechaMinEl.value}`;
        }
        if (fechaMaxEl && fechaMaxEl.value) {
            url += `&fechaMax=${fechaMaxEl.value}`;
        }
        
        // Si no existen los inputs de rango de fechas aún, caemos al día de hoy por defecto
        if ((!fechaMinEl || !fechaMinEl.value) && (!fechaMaxEl || !fechaMaxEl.value)) {
            const todayStr = getLocalDateStr();
            url += `&dia=${todayStr}`;
        }

        const respuesta = await apiClient.get(url);
        
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta inválida:', respuesta);
            tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error: Respuesta inválida del servidor</td></tr>';
            return;
        }
        
        ventas = respuesta.data;
        console.log('Pedidos cargados:', ventas);

        // Obtener el valor actual del buscador si existe y renderizar
        const searchInput = document.getElementById('pedidoSearchInput');
        const query = searchInput ? searchInput.value : '';
        renderVentasTable(query);

    } catch (error) {
        console.error('Error al cargar ventas:', error);
        tablaPedidos.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Error al cargar pedidos: ${escapeHtml(error.message)}</td></tr>`;
    }
}

/**
 * Renderiza la tabla de pedidos filtrando localmente por el texto provisto.
 */
function renderVentasTable(filterQuery = '') {
    if (!tablaPedidos) return;

    // Guardar el scroll actual para evitar que la pantalla salte hacia arriba
    const currentScrollY = window.scrollY;

    tablaPedidos.innerHTML = '';
    const query = filterQuery.toLowerCase().trim();

    // Filtrar localmente en base al query
    const ventasFiltradas = ventas.filter(venta => {
        if (!query) return true;
        const clienteName = (venta.clienteNombre || '').toLowerCase();
        const vendedorName = (venta.empleadoNombre || '').toLowerCase();
        const vendedorLastName = (venta.empleadoApellido || '').toLowerCase();
        const fecha = (venta.fechaEmision || '').toLowerCase();
        const total = String(venta.total || '');
        const id = String(venta.id || '');

        return clienteName.includes(query) || 
               vendedorName.includes(query) || 
               vendedorLastName.includes(query) ||
               fecha.includes(query) ||
               total.includes(query) ||
               id.includes(query);
    });

    currentRenderedVentas = sortVentasPorOrdenImpresion(ventasFiltradas);

    if (ventasFiltradas.length === 0) {
        if (query) {
            tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3">No se encontraron pedidos que coincidan con la búsqueda</td></tr>';
        } else {
            const fechaMinEl = document.getElementById('fechaMinInput');
            const fechaMaxEl = document.getElementById('fechaMaxInput');
            const todayStr = getLocalDateStr();
            
            if (fechaMinEl && fechaMaxEl && (fechaMinEl.value !== todayStr || fechaMaxEl.value !== todayStr)) {
                tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3">No hay pedidos registrados en el rango de fechas seleccionado</td></tr>';
            } else {
                tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3">No hay pedidos registrados el día de hoy</td></tr>';
            }
        }
        return;
    }

    const ventasOrdenadas = sortVentasPorOrdenImpresion(ventasFiltradas);

    ventasOrdenadas.forEach(venta => {
        const clienteName = venta.clienteNombre || 'Cliente Desconocido';
        const estadoBadge = venta.activo 
            ? '<span class="badge bg-success">Activo</span>'
            : '<span class="badge bg-danger">Cancelado</span>';
            
        const valorVisible = (venta.ordenImpresion !== null && venta.ordenImpresion < 1000000) ? venta.ordenImpresion : '';
        const inputOrden = venta.activo 
            ? `<input type="number" min="1" class="form-control text-center mx-auto input-orden-impresion" style="width: 70px; height: 32px; padding: 0.2rem; font-size: 0.95rem; background-color: #0f1623; color: white; border: 1px solid var(--border-color);" data-id="${venta.id}" value="${valorVisible}" placeholder="-">`
            : '-';

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${escapeHtml(clienteName)}</td>
            <td>${escapeHtml(venta.fechaEmision) || 'N/A'}</td>
            <td>$${formatCurrency(venta.total)}</td>
            <td>${estadoBadge}</td>
            <td>${inputOrden}</td>
            <td>
                <button class="btn btn-sm action-btn border-0 btn-ver" data-id="${venta.id}" data-bs-toggle="modal" data-bs-target="#verPedidoModal" title="Ver Detalle">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${venta.id}" data-activo="${venta.activo}" data-bs-toggle="modal" data-bs-target="#editPedidoModal" title="Editar Pedido">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm action-btn border-0 btn-imprimir-fila" data-id="${venta.id}" title="Imprimir Comprobante">
                    <i class="fas fa-print"></i>
                </button>
                <button class="btn btn-sm action-btn border-0 btn-whatsapp-fila" data-id="${venta.id}" title="Enviar por WhatsApp" style="color: #25d366;">
                    <i class="fab fa-whatsapp"></i>
                </button>
            </td>
            <td><i class="fas fa-grip-vertical drag-handle" style="cursor: grab; color: #6c757d; padding: 0.5rem;"></i></td>
        `;
        fila.dataset.id = venta.id;
        tablaPedidos.appendChild(fila);
    });

    // Agregar event listeners para ordenImpresion
    document.querySelectorAll('.input-orden-impresion').forEach(input => {
        input.addEventListener('focus', function() {
            this.select();
        });
        
        input.addEventListener('change', async (e) => {
            const id = e.target.getAttribute('data-id');
            const val = e.target.value.trim();
            const ordenImpresion = val === '' ? null : parseInt(val, 10);
            
            try {
                await apiClient.patch(`/ventas/${id}/orden-impresion`, { ordenImpresion });
                showToast('Orden de impresión actualizada.');
                await cargarVentas(true); // Recargar para aplicar ordenamiento (silencioso)
            } catch (err) {
                showToast(err.message || 'Error al actualizar orden.', 'error');
                renderVentasTable(filterQuery); // Revertir a la vista original
            }
        });
    });

    const fechaMinEl = document.getElementById('fechaMinInput');
    const fechaMaxEl = document.getElementById('fechaMaxInput');
    const todayStr = getLocalDateStr();
    const hasActiveFilters = query !== '' || 
        (fechaMinEl && fechaMinEl.value !== '' && fechaMinEl.value !== todayStr) ||
        (fechaMaxEl && fechaMaxEl.value !== '' && fechaMaxEl.value !== todayStr);

    if (!sortableInstance && typeof Sortable !== 'undefined') {
        sortableInstance = new Sortable(tablaPedidos, {
            handle: '.drag-handle',
            animation: 150,
            swap: true,
            swapClass: 'highlight',
            forceFallback: true, // Requerido para que el plugin Swap detecte bien el elemento y permita opacidad
            onEnd: async function (e) {
                if (e.oldIndex === e.newIndex) return;
                
                const id1 = parseInt(e.item.dataset.id, 10);
                let id2 = null;
                if (e.swapItem) {
                    id2 = parseInt(e.swapItem.dataset.id, 10);
                } else {
                    // Fallback to shifting logic if swap plugin is missing
                    id2 = currentRenderedVentas[e.newIndex]?.id;
                }

                if (!id1 || !id2 || id1 === id2) return;

                try {
                    await apiClient.patch('/ventas/orden-impresion/swap', { id1, id2 });
                    showToast('Orden de impresión intercambiada exitosamente.');
                } catch (err) {
                    showToast(err.message || 'Error al intercambiar orden.', 'error');
                } finally {
                    await cargarVentas(true);
                }
            }
        });
    }

    if (sortableInstance) {
        sortableInstance.option('disabled', hasActiveFilters);
        const dragHandles = document.querySelectorAll('.drag-handle');
        if (hasActiveFilters) {
            dragHandles.forEach(el => {
                el.style.opacity = '0.3';
                el.style.cursor = 'not-allowed';
                el.title = 'Reordenamiento deshabilitado por filtros activos';
            });
        } else {
            dragHandles.forEach(el => {
                el.style.opacity = '1';
                el.style.cursor = 'grab';
                el.title = 'Arrastrar para reordenar';
            });
        }
    }

    // Restaurar el scroll original
    window.scrollTo(0, currentScrollY);
}

/**
 * Agrega un producto a la lista temporal en el modal de creación
 */
async function agregarProductoTemporal() {
    const clientName = document.getElementById('pedidoCliente').value.trim();
    const productName = document.getElementById('productoSelect').value.trim();
    const cantidad = parseFloat(document.getElementById('productoCantidad').value);

    if (isNaN(cantidad) || cantidad < 0.5 || (cantidad * 2) % 1 !== 0) {
        showToast('La cantidad debe ser al menos 0.5 y en incrementos de 0.5 (ej: 0.5, 1, 1.5, 2...).', 'error');
        return;
    }

    if (!clientName) {
        showToast('Debe seleccionar primero un cliente para obtener su lista de precios.', 'error');
        return;
    }

    const client = clientes.find(c => c.nombre === clientName);
    if (!client) {
        showToast('El cliente ingresado no es válido. Por favor, selecciónelo de la lista.', 'error');
        return;
    }

    const product = productos.find(p => p.nombre === productName);
    if (!product) {
        showToast('El producto ingresado no es válido. Por favor, selecciónelo de la lista.', 'error');
        return;
    }

    try {
        // Obtener los precios del producto desde memoria
        const prices = product.precios || [];
        
        const clientListId = client.listaPreciosId || 1;
        let priceRecord = prices.find(p => p.listaPreciosId === clientListId);

        if (!priceRecord && prices.length > 0) {
            priceRecord = [...prices].sort((a, b) => b.listaPreciosId - a.listaPreciosId)[0];
            showToast(`Precio no encontrado en la lista del cliente (Lista ${clientListId}). Se usó precio de Lista ${priceRecord.listaPreciosId}.`, 'warning');
        }

        if (!priceRecord) {
            showToast(`No se encontró un precio para este producto en ninguna lista de precios.`, 'error');
            btnAgregarProducto.disabled = false;
            return;
        }

        const existingIndex = detallesTemporales.findIndex(d => d.productoId === product.id);
        if (existingIndex !== -1) {
            detallesTemporales[existingIndex].cantidad = cantidad;
            detallesTemporales[existingIndex].subtotal = parseFloat((cantidad * detallesTemporales[existingIndex].precio).toFixed(2));
        } else {
            detallesTemporales.push({
                productoId: product.id,
                precioId: priceRecord.id,
                nombre: product.nombre,
                precio: priceRecord.precio,
                cantidad: cantidad,
                subtotal: parseFloat((cantidad * priceRecord.precio).toFixed(2))
            });
        }

        renderDetallesTemporales();
        
        // Limpiar inputs de producto y volver el foco al buscador
        document.getElementById('productoSelect').value = '';
        document.getElementById('productoCantidad').value = '1';
        document.getElementById('productoSelect').focus();
    } catch (error) {
        console.error('Error al agregar producto al pedido:', error);
        showToast('Hubo un error al consultar el precio del producto.', 'error');
    } finally {
        btnAgregarProducto.disabled = false;
    }
}

/**
 * Renderiza los detalles de productos agregados temporalmente en la tabla del modal
 */
function renderDetallesTemporales() {
    const inputCliente = document.getElementById('pedidoCliente');
    
    if (detallesTemporales.length === 0) {
        tablaPedidoDetallesBody.innerHTML = `
            <tr id="filaVacia">
                <td colspan="5" class="text-secondary py-3">No hay productos agregados a este pedido.</td>
            </tr>
        `;
        pedidoTotalLabel.textContent = '$0.00';
        inputCliente.removeAttribute('disabled');
        return;
    }

    // Bloquear cambio de cliente si hay productos cargados para mantener coherencia de precios
    inputCliente.setAttribute('disabled', 'true');

    tablaPedidoDetallesBody.innerHTML = '';
    let total = 0;

    detallesTemporales.forEach((d, idx) => {
        total += d.subtotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(d.nombre)}</td>
            <td>
                <div class="d-flex align-items-center justify-content-center gap-1">
                    $<input type="number" min="0" step="0.01" class="form-control text-center new-item-price" style="width: 90px; height: 32px !important; padding: 0.2rem !important; font-size: 0.95rem !important; background-color: #0f1623; color: white; border: 1px solid var(--border-color);" data-index="${idx}" value="${d.precio.toFixed(2)}" onfocus="this.select()" onclick="this.select()">
                </div>
            </td>
            <td>
                <input type="number" min="0.5" step="0.5" class="form-control text-center mx-auto new-item-qty" style="width: 80px; height: 32px !important; padding: 0.2rem !important; font-size: 0.95rem !important; background-color: #0f1623; color: white; border: 1px solid var(--border-color);" data-index="${idx}" value="${d.cantidad}" onfocus="this.select()" onclick="this.select()">
            </td>
            <td>$${formatCurrency(d.subtotal)}</td>
            <td>
                <button type="button" class="btn btn-sm action-btn delete border-0 btn-eliminar-item" data-index="${idx}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tablaPedidoDetallesBody.appendChild(tr);
    });

    pedidoTotalLabel.textContent = `$${formatCurrency(total)}`;

    // Agregar manejadores de eventos para eliminar ítems
    document.querySelectorAll('.btn-eliminar-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'), 10);
            detallesTemporales.splice(index, 1);
            renderDetallesTemporales();
        });
    });

    // Agregar manejadores de eventos para cambiar el precio personalizado
    document.querySelectorAll('.new-item-price').forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'), 10);
            const val = parseFloat(input.value);
            if (!isNaN(val) && val >= 0) {
                detallesTemporales[index].precio = val;
                detallesTemporales[index].subtotal = parseFloat((val * detallesTemporales[index].cantidad).toFixed(2));
                renderDetallesTemporales();
            } else {
                if (!isNaN(val) && val < 0) {
                    showToast('El precio unitario no puede ser negativo.', 'error');
                }
                input.value = detallesTemporales[index].precio.toFixed(2);
            }
        });
    });

    // Agregar manejadores de eventos para cambiar la cantidad personalizada
    document.querySelectorAll('.new-item-qty').forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'), 10);
            const val = parseFloat(input.value);
            if (!isNaN(val) && val >= 0.5 && (val * 2) % 1 === 0) {
                detallesTemporales[index].cantidad = val;
                detallesTemporales[index].subtotal = parseFloat((val * detallesTemporales[index].precio).toFixed(2));
                renderDetallesTemporales();
            } else {
                if (!isNaN(val)) {
                    showToast('La cantidad debe ser al menos 0.5 y en incrementos de 0.5.', 'error');
                }
                input.value = detallesTemporales[index].cantidad;
            }
        });
    });
}

/**
 * Envía la creación del pedido al backend
 */
async function guardarPedido() {
    const empName = document.getElementById('pedidoEmpleado').value.trim();
    const clientName = document.getElementById('pedidoCliente').value.trim();

    const employee = empleados.find(e => `${e.nombre} ${e.apellido}` === empName);
    if (!employee) {
        showToast('Debe seleccionar un empleado válido.', 'error');
        return;
    }

    const client = clientes.find(c => c.nombre === clientName);
    if (!client) {
        showToast('Debe seleccionar un cliente válido.', 'error');
        return;
    }

    if (detallesTemporales.length === 0) {
        showToast('Debe agregar al menos un producto al pedido antes de confirmar.', 'error');
        return;
    }

    const ordenVal = document.getElementById('ordenImpresion')?.value;
    const ordenImpresion = ordenVal ? parseInt(ordenVal, 10) : null;

    const payload = {
        empleadoId: employee.id,
        clienteId: client.id,
        ordenImpresion: ordenImpresion,
        detalles: detallesTemporales.map(d => ({
            productoId: d.productoId,
            precioId: d.precioId,
            cantidad: d.cantidad,
            precio: d.precio
        }))
    };

    try {
        btnConfirmarPedido.disabled = true;
        console.log('Creando pedido:', payload);
        await apiClient.post('/ventas', payload);
        
        showToast('Pedido creado exitosamente.');
        modalAgregarPedido.hide();
        await cargarVentas();
    } catch (error) {
        console.error('Error al crear pedido:', error);
        showToast(error.message || 'Hubo un error al registrar el pedido.', 'error');
    } finally {
        btnConfirmarPedido.disabled = false;
    }
}

/**
 * Agrega un producto a la lista temporal en el modal de EDICIÓN
 */
async function agregarProductoEdicion() {
    const productName = document.getElementById('editProductoSelect').value.trim();
    const cantidad = parseFloat(document.getElementById('editProductoCantidad').value);

    if (isNaN(cantidad) || cantidad < 0.5 || (cantidad * 2) % 1 !== 0) {
        showToast('La cantidad debe ser al menos 0.5 y en incrementos de 0.5 (ej: 0.5, 1, 1.5, 2...).', 'error');
        return;
    }

    if (!currentClienteEdicion) {
        showToast('Error: cliente de edición no inicializado.', 'error');
        return;
    }

    const product = productos.find(p => p.nombre === productName);
    if (!product) {
        showToast('El producto ingresado no es válido. Por favor, selecciónelo de la lista.', 'error');
        return;
    }

    try {
        // Obtener los precios del producto desde memoria
        const prices = product.precios || [];
        
        const clientListId = currentClienteEdicion.listaPreciosId || 1;
        let priceRecord = prices.find(p => p.listaPreciosId === clientListId);

        if (!priceRecord && prices.length > 0) {
            priceRecord = [...prices].sort((a, b) => b.listaPreciosId - a.listaPreciosId)[0];
            showToast(`Precio no encontrado en la lista del cliente (Lista ${clientListId}). Se usó precio de Lista ${priceRecord.listaPreciosId}.`, 'warning');
        }

        if (!priceRecord) {
            showToast(`No se encontró un precio para este producto en ninguna lista de precios.`, 'error');
            btnEditAgregarProducto.disabled = false;
            return;
        }

        const existingIndex = detallesEdicion.findIndex(d => d.productoId === product.id);
        if (existingIndex !== -1) {
            detallesEdicion[existingIndex].cantidad = cantidad;
            detallesEdicion[existingIndex].subtotal = parseFloat((cantidad * detallesEdicion[existingIndex].precio).toFixed(2));
        } else {
            detallesEdicion.push({
                productoId: product.id,
                precioId: priceRecord.id,
                nombre: `${product.nombre} (${product.marca})`,
                precio: priceRecord.precio,
                cantidad: cantidad,
                subtotal: parseFloat((cantidad * priceRecord.precio).toFixed(2))
            });
        }

        renderDetallesEdicion();
        
        // Limpiar inputs
        document.getElementById('editProductoSelect').value = '';
        document.getElementById('editProductoCantidad').value = '1';
        document.getElementById('editProductoSelect').focus();
    } catch (error) {
        console.error('Error al agregar producto al pedido en edición:', error);
        showToast('Hubo un error al consultar el precio del producto.', 'error');
    } finally {
        btnEditAgregarProducto.disabled = false;
    }
}

/**
 * Renderiza la lista de detalles del pedido en el modal de EDICIÓN
 */
function renderDetallesEdicion() {
    if (detallesEdicion.length === 0) {
        editPedidoDetallesBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-secondary py-3">No hay productos cargados en este pedido.</td>
            </tr>
        `;
        editPedidoTotalLabel.textContent = '$0.00';
        return;
    }

    editPedidoDetallesBody.innerHTML = '';
    let total = 0;

    detallesEdicion.forEach((d, idx) => {
        total += d.subtotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(d.nombre)}</td>
            <td>
                <div class="d-flex align-items-center justify-content-center gap-1">
                    $<input type="number" min="0" step="0.01" class="form-control text-center edit-item-price" style="width: 90px; height: 32px !important; padding: 0.2rem !important; font-size: 0.95rem !important; background-color: #0f1623; color: white; border: 1px solid var(--border-color);" data-index="${idx}" value="${d.precio.toFixed(2)}" onfocus="this.select()" onclick="this.select()">
                </div>
            </td>
            <td>
                <input type="number" min="0.5" step="0.5" class="form-control text-center mx-auto edit-item-qty" style="width: 80px; height: 32px !important; padding: 0.2rem !important; font-size: 0.95rem !important;" data-index="${idx}" value="${d.cantidad}" onfocus="this.select()" onclick="this.select()">
            </td>
            <td>$${formatCurrency(d.subtotal)}</td>
            <td>
                <button type="button" class="btn btn-sm action-btn delete border-0 btn-eliminar-item-edicion" data-index="${idx}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        editPedidoDetallesBody.appendChild(tr);
    });

    editPedidoTotalLabel.textContent = `$${formatCurrency(total)}`;

    // Manejador para eliminar ítems en edición
    document.querySelectorAll('.btn-eliminar-item-edicion').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'), 10);
            detallesEdicion.splice(index, 1);
            renderDetallesEdicion();
        });
    });

    // Manejador para cambiar el precio personalizado en edición
    document.querySelectorAll('.edit-item-price').forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'), 10);
            const val = parseFloat(input.value);
            if (!isNaN(val) && val >= 0) {
                detallesEdicion[index].precio = val;
                detallesEdicion[index].subtotal = parseFloat((val * detallesEdicion[index].cantidad).toFixed(2));
                renderDetallesEdicion();
            } else {
                if (!isNaN(val) && val < 0) {
                    showToast('El precio unitario no puede ser negativo.', 'error');
                }
                input.value = detallesEdicion[index].precio.toFixed(2);
            }
        });
    });

    // Manejador para cambiar la cantidad en edición
    document.querySelectorAll('.edit-item-qty').forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'), 10);
            const val = parseFloat(input.value);
            if (!isNaN(val) && val >= 0.5 && (val * 2) % 1 === 0) {
                detallesEdicion[index].cantidad = val;
                detallesEdicion[index].subtotal = parseFloat((val * detallesEdicion[index].precio).toFixed(2));
                renderDetallesEdicion();
            } else {
                if (!isNaN(val)) {
                    showToast('La cantidad debe ser al menos 0.5 y en incrementos de 0.5.', 'error');
                }
                input.value = detallesEdicion[index].cantidad;
            }
        });
    });
}

/**
 * Agrupa todos los pedidos activos de hoy y genera el ticket consolidado para depósito.
 */
function generarConsolidadoHtml() {
    const consolidado = {};
    
    // Sumar cantidades por producto únicamente para ventas activas
    ventas.forEach(venta => {
        if (!venta.activo) return;
        
        venta.detalles.forEach(d => {
            const product = productos.find(p => p.id === d.productoId);
            const productName = product ? `${product.nombre} (${product.marca})` : `Producto #${d.productoId}`;
            
            if (consolidado[productName]) {
                consolidado[productName] += d.cantidad;
            } else {
                consolidado[productName] = d.cantidad;
            }
        });
    });

    const items = Object.entries(consolidado).map(([nombre, cantidad]) => {
        const product = productos.find(p => `${p.nombre} (${p.marca})` === nombre);
        const marca = product ? product.marca : '';
        return { nombre, cantidad, marca };
    });

    items.sort((a, b) => {
        const marcaA = a.marca.toLowerCase();
        const marcaB = b.marca.toLowerCase();
        if (marcaA < marcaB) return -1;
        if (marcaA > marcaB) return 1;
        
        const nombreA = a.nombre.toLowerCase();
        const nombreB = b.nombre.toLowerCase();
        if (nombreA < nombreB) return -1;
        if (nombreA > nombreB) return 1;
        return 0;
    });

    if (items.length === 0) {
        showToast('No hay pedidos activos registrados en el rango seleccionado para enviar al depósito.', 'error');
        return false;
    }

    const formattedDate = getRangoFechasFormateado();
    const today = new Date();
    const folioStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;

    const printSection = document.getElementById('printSection');
    if (printSection) {
        printSection.innerHTML = `
            <div class="header-container">
                <div class="header-left">
                    <p class="recibo-label">Recibo de venta</p>
                    <h1>${escapeHtml(configuracionNegocio.nombre_negocio)}</h1>
                    <p class="info-line"><strong>${escapeHtml(configuracionNegocio.info_contacto)}</strong></p>
                    <p class="info-line">Cliente: CONSOLIDADO DE CARGA</p>
                    <p class="info-line">Depósito General</p>
                </div>
                <div class="header-right">
                    <img src="../../assets/logo.png" alt="Logo Cigarrillo">
                </div>
            </div>
            
            <div class="meta-section">
                <span>Folio: <span>${folioStr}</span></span> &nbsp;&nbsp;&nbsp;&nbsp; <span>Fecha: <span>${formattedDate}</span></span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th class="col-producto">PRODUCTO</th>
                        <th class="col-cantidad" style="text-align: center;">CANTIDAD</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td># ${item.nombre.toUpperCase()}</td>
                            <td class="cant-cell">${item.cantidad}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        return true;
    }
    return false;
}

function waitImagesAndPrint(elementId = 'printSection') {
    const printSection = document.getElementById(elementId);
    if (!printSection) {
        window.print();
        return;
    }
    const images = printSection.querySelectorAll('img');
    if (images.length === 0) {
        window.print();
        return;
    }
    const promises = Array.from(images).map(img => {
        if (img.complete) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });
    Promise.all(promises).then(() => {
        setTimeout(() => {
            window.print();
        }, 50);
    });
}

// New function to show preview before printing
function previewAndPrint(elementId = 'printSection') {
    const source = document.getElementById(elementId);
    if (!source) {
        console.warn('Preview source not found');
        return;
    }
    const previewBody = document.getElementById('previewPrintBody');
    if (!previewBody) {
        console.warn('Preview modal body not found');
        return;
    }
    previewBody.innerHTML = source.innerHTML;
    const previewModalEl = document.getElementById('previewPrintModal');
    if (previewModalEl) {
        const previewModal = bootstrap.Modal.getOrCreateInstance(previewModalEl);
        previewModal.show();
    }
}

// Attach click handler for the print button inside preview modal
document.addEventListener('DOMContentLoaded', () => {
    const btnPrintFromPreview = document.getElementById('btnPrintFromPreview');
    if (btnPrintFromPreview) {
        btnPrintFromPreview.addEventListener('click', () => {
            // Copy preview content to the dedicated print section
            const previewSection = document.getElementById('previewPrintBody');
            const printSection = document.getElementById('printSection');
            if (previewSection && printSection) {
                printSection.innerHTML = previewSection.innerHTML;
                
                // Trigger printing using waitImagesAndPrint on the printSection
                waitImagesAndPrint('printSection');
            }
        });
    }

    // Zoom Logic
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const zoomLevelText = document.getElementById('zoomLevelText');
    const previewPrintBody = document.getElementById('previewPrintBody');
    
    let currentZoom = 1;
    
    if (btnZoomIn && btnZoomOut && zoomLevelText && previewPrintBody) {
        const previewModal = document.getElementById('previewPrintModal');
        if (previewModal) {
            previewModal.addEventListener('show.bs.modal', () => {
                currentZoom = 1;
                updateZoom();
            });
        }
        
        const updateZoom = () => {
            zoomLevelText.textContent = Math.round(currentZoom * 100) + '%';
            previewPrintBody.style.transform = `scale(${currentZoom})`;
            previewPrintBody.style.transformOrigin = 'top center';
            // Adjust container spacing to prevent overlap if scaled heavily
            previewPrintBody.style.marginBottom = (currentZoom > 1) ? `${(currentZoom - 1) * 100}%` : '0';
        };

        btnZoomIn.addEventListener('click', () => {
            if (currentZoom < 3.0) {
                currentZoom += 0.1;
                updateZoom();
            }
        });

        btnZoomOut.addEventListener('click', () => {
            if (currentZoom > 0.3) {
                currentZoom -= 0.1;
                updateZoom();
            }
        });
    }
});

function imprimirConsolidado() {
    if (generarConsolidadoHtml()) {
        previewAndPrint();
    }
}

function enviarConsolidadoWSP() {
    if (generarConsolidadoHtml()) {
        const todayStr = getLocalDateStr();
        enviarPDFPorWhatsApp('printSection', `consolidado_deposito_${todayStr}.pdf`, '', 'deposito');
    }
}

/**
 * Agrupa los pedidos activos de hoy por cliente y genera el resumen de cobros.
 */
function generarResumenDiarioHtml() {
    const resumen = {};
    let totalGeneral = 0;

    ventas.forEach(venta => {
        if (!venta.activo) return;
        const clienteName = venta.clienteNombre || 'Cliente Desconocido';
        const total = Number(venta.total) || 0;
        
        if (resumen[clienteName]) {
            resumen[clienteName] += total;
        } else {
            resumen[clienteName] = total;
        }
        totalGeneral += total;
    });

    const items = Object.entries(resumen).map(([cliente, total]) => ({ cliente, total }));
    
    // Ordenar alfabéticamente por cliente
    items.sort((a, b) => a.cliente.localeCompare(b.cliente));

    if (items.length === 0) {
        showToast('No hay pedidos activos registrados en el rango seleccionado.', 'error');
        return false;
    }

    const formattedDate = getRangoFechasFormateado();

    const printSection = document.getElementById('printSection');
    if (printSection) {
        printSection.innerHTML = `
            <div class="header-container">
                <div class="header-left">
                    <p class="recibo-label">Resumen Diario de Clientes</p>
                    <h1>${escapeHtml(configuracionNegocio.nombre_negocio)}</h1>
                    <p class="info-line"><strong>${escapeHtml(configuracionNegocio.info_contacto)}</strong></p>
                    <p class="info-line">Reporte: TOTALES A PAGAR POR CLIENTE</p>
                </div>
                <div class="header-right">
                    <img src="../../assets/logo.png" alt="Logo Cigarrillo">
                </div>
            </div>
            
            <div class="meta-section">
                <span>Fecha: <span>${formattedDate}</span></span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 70%;">CLIENTE</th>
                        <th class="text-right" style="width: 30%;">TOTAL A PAGAR</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.cliente.toUpperCase()}</td>
                            <td class="text-right">$${formatCurrency(item.total)}</td>
                        </tr>
                    `).join('')}
                    <tr style="border-top: 2px solid #000; font-weight: bold;">
                        <td class="text-right" style="border: none !important; padding-top: 15px; font-size: 15px;">TOTAL GENERAL:</td>
                        <td class="text-right" style="border: none !important; padding-top: 15px; font-size: 15px; font-weight: bold;">$${formatCurrency(totalGeneral)}</td>
                    </tr>
                </tbody>
            </table>
        `;
        return true;
    }
    return false;
}

function imprimirResumenDiario() {
    if (generarResumenDiarioHtml()) {
        previewAndPrint();
    }
}

/**
 * Agrupa todos los pedidos activos de hoy y genera una sola sección de impresión con saltos de página entre cada uno.
 */
function generarTodosLosPedidosHtml() {
    const activeVentas = sortVentasPorOrdenImpresion(ventas.filter(v => v.activo));
    if (activeVentas.length === 0) {
        showToast('No hay pedidos activos registrados en el rango seleccionado.', 'error');
        return false;
    }

    const printSection = document.getElementById('printSection');
    if (!printSection) return false;

    let combinedHtml = '';

    activeVentas.forEach((venta, index) => {
        const clienteName = venta.clienteNombre || 'Cliente Desconocido';
        const clientObj = clientes.find(c => c.id === venta.clienteId);
        const clienteDireccion = clientObj && clientObj.direccion ? clientObj.direccion : '';
        const empleadoName = venta.empleadoNombre && venta.empleadoApellido
            ? `${venta.empleadoNombre} ${venta.empleadoApellido}`
            : (venta.empleadoNombre || 'N/A');

        const formattedDate = venta.fechaEmision || 'N/A';
        const folioStr = venta.id.toString().padStart(6, '0');

        const detailsHtml = venta.detalles.map(d => {
            const product = productos.find(p => p.id === d.productoId);
            const productName = product ? `${product.nombre} (${product.marca})` : `Producto #${d.productoId}`;
            return `
                <tr>
                    <td>${productName.toUpperCase()}</td>
                    <td class="text-center">${d.cantidad}</td>
                    <td class="text-right">$${formatCurrency(d.precio)}</td>
                    <td class="text-right">$${formatCurrency(d.subtotal)}</td>
                </tr>
            `;
        }).join('');

        const totalStr = formatCurrency(venta.total);
        combinedHtml += `
            <div class="ticket-pedido-print" style="padding-bottom: 20px;">
                <div class="header-container">
                    <div class="header-left">
                        <p class="recibo-label">Comprobante de Pedido</p>
                        <h1>${escapeHtml(configuracionNegocio.nombre_negocio)}</h1>
                        <p class="info-line"><strong>${escapeHtml(configuracionNegocio.info_contacto)}</strong></p>
                        <p class="info-line">Cliente: ${clienteName.toUpperCase()}</p>
                        ${clienteDireccion ? `<p class="info-line">Dirección: ${clienteDireccion.toUpperCase()}</p>` : ''}
                        <p class="info-line">Vendedor: ${empleadoName}</p>
                    </div>
                    <div class="header-right">
                        <img src="../../assets/logo.png" alt="Logo Cigarrillo">
                    </div>
                </div>
                
                <div class="meta-section">
                    <span>Pedido N°: <span>${folioStr}</span></span> &nbsp;&nbsp;&nbsp;&nbsp; <span>Fecha: <span>${formattedDate}</span></span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%;">PRODUCTO</th>
                            <th class="text-center" style="width: 15%;">CANTIDAD</th>
                            <th class="text-right" style="width: 17%;">PRECIO UNIT.</th>
                            <th class="text-right" style="width: 18%;">SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detailsHtml}
                        <tr style="border-top: 2px solid #000; font-weight: bold;">
                            <td colspan="3" class="text-right" style="border: none !important; padding-top: 15px; font-size: 15px;">TOTAL A PAGAR:</td>
                            <td class="text-right" style="border: none !important; padding-top: 15px; font-size: 15px; font-weight: bold;">$${totalStr}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    });

    printSection.innerHTML = combinedHtml;
    return true;
}

function imprimirTodosLosPedidos() {
    if (generarTodosLosPedidosHtml()) {
        previewAndPrint();
    }
}

/**
 * Agrupa los pedidos activos de hoy para un empleado específico y genera su consolidado.
 */
function generarEmpleadoHtml(empleadoId) {
    const employee = empleados.find(e => String(e.id) === String(empleadoId));
    if (!employee) {
        showToast('Empleado no encontrado.', 'error');
        return false;
    }

    const consolidado = {};
    const employeeName = `${employee.nombre} ${employee.apellido}`;

    // Filtrar ventas de este empleado (sólo las activas)
    const employeeVentas = ventas.filter(v => v.activo && String(v.empleadoId) === String(empleadoId));

    employeeVentas.forEach(venta => {
        venta.detalles.forEach(d => {
            const product = productos.find(p => p.id === d.productoId);
            const productName = product ? `${product.nombre} (${product.marca})` : `Producto #${d.productoId}`;
            
            if (consolidado[productName]) {
                consolidado[productName] += d.cantidad;
            } else {
                consolidado[productName] = d.cantidad;
            }
        });
    });

    const items = Object.entries(consolidado).map(([nombre, cantidad]) => {
        const product = productos.find(p => `${p.nombre} (${p.marca})` === nombre);
        const marca = product ? product.marca : '';
        return { nombre, cantidad, marca };
    });

    items.sort((a, b) => {
        const marcaA = a.marca.toLowerCase();
        const marcaB = b.marca.toLowerCase();
        if (marcaA < marcaB) return -1;
        if (marcaA > marcaB) return 1;
        
        const nombreA = a.nombre.toLowerCase();
        const nombreB = b.nombre.toLowerCase();
        if (nombreA < nombreB) return -1;
        if (nombreA > nombreB) return 1;
        return 0;
    });

    if (items.length === 0) {
        showToast(`No hay pedidos activos asignados a ${employeeName} en el rango seleccionado.`, 'error');
        return false;
    }

    const formattedDate = getRangoFechasFormateado();
    const today = new Date();
    const folioStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-EMP${empleadoId}`;

    const printSection = document.getElementById('printSection');
    if (printSection) {
        printSection.innerHTML = `
            <div class="header-container">
                <div class="header-left">
                    <p class="recibo-label">Detalle por Empleado</p>
                    <h1>${escapeHtml(configuracionNegocio.nombre_negocio)}</h1>
                    <p class="info-line"><strong>${escapeHtml(configuracionNegocio.info_contacto)}</strong></p>
                    <p class="info-line">Empleado: ${employeeName.toUpperCase()}</p>
                    <p class="info-line">Consolidado de Carga Asignada</p>
                </div>
                <div class="header-right">
                    <img src="../../assets/logo.png" alt="Logo Cigarrillo">
                </div>
            </div>
            
            <div class="meta-section">
                <span>Folio: <span>${folioStr}</span></span> &nbsp;&nbsp;&nbsp;&nbsp; <span>Fecha: <span>${formattedDate}</span></span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th class="col-producto">PRODUCTO</th>
                        <th class="col-cantidad" style="text-align: center;">CANTIDAD</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td># ${item.nombre.toUpperCase()}</td>
                            <td class="cant-cell">${item.cantidad}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        return true;
    }
    return false;
}

function imprimirEmpleado(empleadoId) {
    if (generarEmpleadoHtml(empleadoId)) {
        previewAndPrint();
    }
}

function enviarEmpleadoWSP(empleadoId) {
    if (generarEmpleadoHtml(empleadoId)) {
        const todayStr = getLocalDateStr();
        enviarPDFPorWhatsApp('printSection', `consolidado_empleado_${empleadoId}_${todayStr}.pdf`);
    }
}

/**
 * Genera e imprime el ticket de detalle para el cliente.
 */
function generarClienteHtml(ventaId) {
    const venta = ventas.find(v => String(v.id) === String(ventaId));
    if (!venta) {
        showToast('Pedido no encontrado.', 'error');
        return false;
    }

    const clienteName = venta.clienteNombre || 'Cliente Desconocido';
    const clientObj = clientes.find(c => c.id === venta.clienteId);
    const clienteDireccion = clientObj && clientObj.direccion ? clientObj.direccion : '';
    const empleadoName = venta.empleadoNombre && venta.empleadoApellido
        ? `${venta.empleadoNombre} ${venta.empleadoApellido}`
        : (venta.empleadoNombre || 'N/A');

    const formattedDate = venta.fechaEmision || 'N/A';
    const folioStr = venta.id.toString().padStart(6, '0');

    const detailsHtml = venta.detalles.map(d => {
        const product = productos.find(p => p.id === d.productoId);
        const productName = product ? `${product.nombre} (${product.marca})` : `Producto #${d.productoId}`;
        return `
            <tr>
                <td>${productName.toUpperCase()}</td>
                <td class="text-center">${d.cantidad}</td>
                <td class="text-right">$${formatCurrency(d.precio)}</td>
                <td class="text-right">$${formatCurrency(d.subtotal)}</td>
            </tr>
        `;
    }).join('');

    const totalStr = formatCurrency(venta.total);

    const printSection = document.getElementById('printSection');
    if (printSection) {
        printSection.innerHTML = `
            <div class="header-container">
                <div class="header-left">
                    <p class="recibo-label">Comprobante de Pedido</p>
                    <h1>${escapeHtml(configuracionNegocio.nombre_negocio)}</h1>
                    <p class="info-line"><strong>${escapeHtml(configuracionNegocio.info_contacto)}</strong></p>
                    <p class="info-line">Cliente: ${clienteName.toUpperCase()}</p>
                    ${clienteDireccion ? `<p class="info-line">Dirección: ${clienteDireccion.toUpperCase()}</p>` : ''}
                    <p class="info-line">Vendedor: ${empleadoName}</p>
                </div>
                <div class="header-right">
                    <img src="../../assets/logo.png" alt="Logo Cigarrillo">
                </div>
            </div>
            
            <div class="meta-section">
                <span>Pedido N°: <span>${folioStr}</span></span> &nbsp;&nbsp;&nbsp;&nbsp; <span>Fecha: <span>${formattedDate}</span></span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 50%;">PRODUCTO</th>
                        <th class="text-center" style="width: 15%;">CANTIDAD</th>
                        <th class="text-right" style="width: 17%;">PRECIO UNIT.</th>
                        <th class="text-right" style="width: 18%;">SUBTOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${detailsHtml}
                    <tr style="border-top: 2px solid #000; font-weight: bold;">
                        <td colspan="3" class="text-right" style="border: none !important; padding-top: 15px; font-size: 15px;">TOTAL A PAGAR:</td>
                        <td class="text-right" style="border: none !important; padding-top: 15px; font-size: 15px; font-weight: bold;">$${totalStr}</td>
                    </tr>
                </tbody>
            </table>
        `;
        return { success: true, clienteId: venta.clienteId, folioStr };
    }
    return false;
}

function imprimirCliente(ventaId) {
    if (generarClienteHtml(ventaId)) {
        previewAndPrint();
    }
}

function enviarClienteWSP(ventaId) {
    const res = generarClienteHtml(ventaId);
    if (res && res.success) {
        const clientObj = clientes.find(c => c.id === res.clienteId);
        const defaultPhone = clientObj ? clientObj.contacto : '';
        enviarPDFPorWhatsApp('printSection', `comprobante_pedido_${res.folioStr}.pdf`, defaultPhone);
    }
}

/**
 * Abre el modal de confirmación de número de WhatsApp, genera el PDF y realiza el envío
 */
function enviarPDFPorWhatsApp(elementId, filename, defaultPhone = '', context = '') {
    const inputNumero = document.getElementById('inputWhatsappNumero');
    if (context === 'deposito' && !defaultPhone) {
        defaultPhone = localStorage.getItem('last_wsp_number_deposito') || '';
    }
    if (inputNumero) {
        inputNumero.value = defaultPhone ? defaultPhone.replace(/[-\s]/g, '') : '';
    }

    // Capturar el contenido HTML del comprobante inmediatamente para evitar
    // que otra acción lo sobreescriba antes de que el usuario confirme el envío
    const sourceElement = document.getElementById(elementId);
    const capturedHtml = sourceElement ? sourceElement.innerHTML : '';

    const modalEl = document.getElementById('modalEnviarWhatsapp');
    // Reutilizar la instancia existente del modal en lugar de crear una nueva
    // para evitar instancias duplicadas que causan que el segundo envío falle
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    const btnConfirmar = document.getElementById('btnConfirmarEnviarWhatsapp');
    const btnCancelar = document.getElementById('btnCancelarEnvioWhatsapp');
    let cancelTimer = null;
    let abortController = null;
    
    // Clonar para remover event listeners previos
    const newBtnConfirmar = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(newBtnConfirmar, btnConfirmar);

    const resetState = () => {
        if (cancelTimer) clearTimeout(cancelTimer);
        if (btnCancelar) btnCancelar.classList.add('d-none');
        newBtnConfirmar.disabled = false;
        newBtnConfirmar.innerHTML = '<i class="fab fa-whatsapp me-1"></i> Enviar PDF';
    };

    if (btnCancelar) {
        const newBtnCancelar = btnCancelar.cloneNode(true);
        btnCancelar.parentNode.replaceChild(newBtnCancelar, btnCancelar);
        newBtnCancelar.addEventListener('click', () => {
            if (abortController) {
                console.log('Abortando envío de WhatsApp por el usuario...');
                abortController.abort();
                showToast('Envío cancelado.', 'error');
                resetState();
            }
        });
    }

    // Abortar si se cierra el modal
    const onModalHidden = () => {
        if (abortController) {
            abortController.abort();
        }
        if (cancelTimer) clearTimeout(cancelTimer);
        modalEl.removeEventListener('hidden.bs.modal', onModalHidden);
    };
    modalEl.addEventListener('hidden.bs.modal', onModalHidden);

    newBtnConfirmar.addEventListener('click', async () => {
        const number = inputNumero.value.trim();
        if (!number) {
            showToast('Debe ingresar un número de teléfono.', 'error');
            return;
        }

        newBtnConfirmar.disabled = true;
        newBtnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Generando PDF...';

        try {
            const element = document.getElementById(elementId);
            // Restaurar el contenido capturado al inicio para asegurar que el PDF
            // contenga el comprobante correcto incluso si printSection fue reutilizado
            if (capturedHtml) {
                element.innerHTML = capturedHtml;
            }
            
            // html2pdf requiere visibilidad temporal en el DOM
            element.classList.remove('d-none');
            
            const opt = {
                margin:       [0.5, 0.5, 0.5, 0.5],
                filename:     filename,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            const pdfBase64DataUri = await html2pdf().set(opt).from(element).outputPdf('datauristring');
            element.classList.add('d-none');

            newBtnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Enviando...';

            const base64Data = pdfBase64DataUri.split(',')[1];

            // Iniciar AbortController y temporizador de cancelación (30 segundos)
            abortController = new AbortController();
            cancelTimer = setTimeout(() => {
                const btnCancelarEl = document.getElementById('btnCancelarEnvioWhatsapp');
                if (btnCancelarEl) {
                    btnCancelarEl.classList.remove('d-none');
                }
            }, 30000);

            // Enviar al backend pasando el signal
            const response = await apiClient.post('/whatsapp/send-pdf', {
                number,
                pdfBase64: base64Data,
                filename
            }, { signal: abortController.signal });

            if (response && response.success) {
                if (context === 'deposito') {
                    localStorage.setItem('last_wsp_number_deposito', number);
                }
                showToast('¡Comprobante enviado por WhatsApp con éxito!', 'success');
                modal.hide();
            } else {
                showToast('Hubo un problema al enviar el WhatsApp.', 'error');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Envío de WhatsApp cancelado con éxito.');
                return;
            }
            console.error('Error al generar o enviar el PDF:', error);
            showToast(error.message || 'Error al procesar el envío por WhatsApp.', 'error');
        } finally {
            resetState();
            abortController = null;
        }
    });
}

/**
 * Actualiza la visibilidad del botón para repetir el último pedido en base a si el cliente seleccionado es válido.
 */
function actualizarVisibilidadBtnRepetir() {
    const inputCliente = document.getElementById('pedidoCliente');
    const btnRepetir = document.getElementById('btnRepetirUltimoPedido');
    if (!inputCliente || !btnRepetir) return;

    const val = inputCliente.value.trim();
    const client = clientes.find(c => c.nombre === val);

    if (client) {
        btnRepetir.classList.remove('d-none');
    } else {
        btnRepetir.classList.add('d-none');
    }
}

/**
 * Obtiene el último pedido del cliente actual y carga sus productos con los precios vigentes.
 */
async function repetirUltimoPedido() {
    const clientName = document.getElementById('pedidoCliente').value.trim();
    if (!clientName) {
        showToast('Debe seleccionar un cliente primero.', 'error');
        return;
    }

    const client = clientes.find(c => c.nombre === clientName);
    if (!client) {
        showToast('Debe seleccionar un cliente válido.', 'error');
        return;
    }

    try {
        const btnRepetir = document.getElementById('btnRepetirUltimoPedido');
        if (btnRepetir) {
            btnRepetir.disabled = true;
            btnRepetir.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        }

        // Obtener el último pedido del cliente
        const respuesta = await apiClient.get(`/ventas/ultimo/${client.id}`);
        if (!respuesta || !respuesta.id) {
            showToast('El cliente no tiene ultimo pedido', 'error');
            return;
        }

        const ultimoPedido = respuesta;
        if (!ultimoPedido.detalles || ultimoPedido.detalles.length === 0) {
            showToast('El último pedido no contiene productos.', 'error');
            return;
        }

        const nuevosDetalles = [];

        for (const d of ultimoPedido.detalles) {
            const product = productos.find(p => p.id === d.productoId);
            const productName = product ? product.nombre : `Producto #${d.productoId}`;

            let price = d.precio;
            let precioId = d.precioId;

            // Intentar usar el precio actual desde memoria
            if (product && product.precios) {
                const prices = product.precios;
                const clientListId = client.listaPreciosId || 1;
                let priceRecord = prices.find(p => p.listaPreciosId === clientListId);
                
                if (!priceRecord && prices.length > 0) {
                    priceRecord = [...prices].sort((a, b) => b.listaPreciosId - a.listaPreciosId)[0];
                    showToast(`Precio no encontrado en la lista del cliente (Lista ${clientListId}) para ${productName}. Se usó precio de Lista ${priceRecord.listaPreciosId}.`, 'warning');
                }
                
                if (priceRecord) {
                    price = priceRecord.precio;
                    precioId = priceRecord.id;
                }
            }

            nuevosDetalles.push({
                productoId: d.productoId,
                precioId: precioId,
                nombre: productName,
                precio: parseFloat(price),
                cantidad: d.cantidad,
                subtotal: parseFloat((d.cantidad * price).toFixed(2))
            });
        }

        // Sobrescribir detalles temporales
        detallesTemporales = nuevosDetalles;
        renderDetallesTemporales();

        showToast('Último pedido cargado correctamente.', 'success');

    } catch (error) {
        console.error('Error al repetir último pedido:', error);
        const status = error.status || error.response?.status;
        if (status === 404) {
            showToast('El cliente no tiene ultimo pedido', 'error');
        } else {
            showToast('Error al intentar cargar el último pedido del cliente.', 'error');
        }
    } finally {
        const btnRepetir = document.getElementById('btnRepetirUltimoPedido');
        if (btnRepetir) {
            btnRepetir.disabled = false;
            btnRepetir.innerHTML = '<i class="fas fa-redo"></i> Cargar último pedido';
        }
    }
}

/**
 * Llena el combo select del modal de empleado.
 */
function updateImprimirEmpleadoSelect() {
    const select = document.getElementById('selectImprimirEmpleado');
    if (!select) return;
    const activeEmployees = empleados.filter(e => e.activo);
    select.innerHTML = '<option value="">-- Seleccione un Empleado --</option>' + 
        activeEmployees.map(e => `<option value="${e.id}">${e.nombre} ${e.apellido}</option>`).join('');
}

/**
 * Llena el combo select del modal de cliente con pedidos activos de hoy.
 */
function updateImprimirClienteSelect() {
    const select = document.getElementById('selectImprimirCliente');
    if (!select) return;
    const activeVentas = sortVentasPorOrdenImpresion(ventas.filter(v => v.activo));
    select.innerHTML = '<option value="">-- Seleccione un Pedido --</option>' + 
        activeVentas.map(v => `<option value="${v.id}">${v.clienteNombre || 'Cliente Desconocido'} - $${Number(v.total).toFixed(2)}</option>`).join('');
}

/**
 * Registra todos los manejadores de eventos
 */
function inicializarEventos() {
    // Evento de agregar producto al detalle (Nuevo Pedido)
    if (btnAgregarProducto) {
        btnAgregarProducto.addEventListener('click', agregarProductoTemporal);
    }

    // Evento de guardar pedido completo (Nuevo Pedido)
    if (btnConfirmarPedido) {
        btnConfirmarPedido.addEventListener('click', guardarPedido);
    }

    // Evento de agregar producto en Edición
    if (btnEditAgregarProducto) {
        btnEditAgregarProducto.addEventListener('click', agregarProductoEdicion);
    }

    // Permitir usar "Enter" en la cantidad para agregar el producto
    const inputProductoCantidad = document.getElementById('productoCantidad');
    if (inputProductoCantidad) {
        inputProductoCantidad.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnAgregarProducto) btnAgregarProducto.click();
            }
        });
    }

    const inputEditProductoCantidad = document.getElementById('editProductoCantidad');
    if (inputEditProductoCantidad) {
        inputEditProductoCantidad.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (btnEditAgregarProducto) btnEditAgregarProducto.click();
            }
        });
    }

    // Evento de input en Selección de Cliente para mostrar/ocultar "Repetir último pedido"
    const inputCliente = document.getElementById('pedidoCliente');
    if (inputCliente) {
        inputCliente.addEventListener('input', actualizarVisibilidadBtnRepetir);
        inputCliente.addEventListener('change', actualizarVisibilidadBtnRepetir);
    }

    // Evento para "Repetir último pedido"
    const btnRepetirUltimoPedido = document.getElementById('btnRepetirUltimoPedido');
    if (btnRepetirUltimoPedido) {
        btnRepetirUltimoPedido.addEventListener('click', repetirUltimoPedido);
    }

    // Eventos para las opciones de impresión
    const btnOptImprimirDeposito = document.getElementById('btnOptImprimirDeposito');
    if (btnOptImprimirDeposito) {
        btnOptImprimirDeposito.addEventListener('click', (e) => {
            e.preventDefault();
            imprimirConsolidado();
        });
    }

    const btnOptEnviarDepositoWSP = document.getElementById('btnOptEnviarDepositoWSP');
    if (btnOptEnviarDepositoWSP) {
        btnOptEnviarDepositoWSP.addEventListener('click', (e) => {
            e.preventDefault();
            enviarConsolidadoWSP();
        });
    }

    const btnOptImprimirResumenDiario = document.getElementById('btnOptImprimirResumenDiario');
    if (btnOptImprimirResumenDiario) {
        btnOptImprimirResumenDiario.addEventListener('click', (e) => {
            e.preventDefault();
            imprimirResumenDiario();
        });
    }

    const btnOptImprimirTodosLosPedidos = document.getElementById('btnOptImprimirTodosLosPedidos');
    if (btnOptImprimirTodosLosPedidos) {
        btnOptImprimirTodosLosPedidos.addEventListener('click', (e) => {
            e.preventDefault();
            imprimirTodosLosPedidos();
        });
    }

    // Modal de impresión por Empleado: poblar opciones al abrir
    const modalImprimirEmpleadoEl = document.getElementById('modalImprimirEmpleado');
    if (modalImprimirEmpleadoEl) {
        modalImprimirEmpleadoEl.addEventListener('show.bs.modal', updateImprimirEmpleadoSelect);
    }

    // Botón confirmar impresión por Empleado
    const btnConfirmarImprimirEmpleado = document.getElementById('btnConfirmarImprimirEmpleado');
    if (btnConfirmarImprimirEmpleado) {
        btnConfirmarImprimirEmpleado.addEventListener('click', () => {
            const empVal = document.getElementById('selectImprimirEmpleado').value;
            if (!empVal) {
                showToast('Debe seleccionar un empleado.', 'error');
                return;
            }
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalImprimirEmpleado'));
            if (modalInstance) modalInstance.hide();
            imprimirEmpleado(parseInt(empVal, 10));
        });
    }

    // Botón confirmar enviar por WhatsApp por Empleado
    const btnConfirmarEnviarEmpleadoWSP = document.getElementById('btnConfirmarEnviarEmpleadoWSP');
    if (btnConfirmarEnviarEmpleadoWSP) {
        btnConfirmarEnviarEmpleadoWSP.addEventListener('click', () => {
            const empVal = document.getElementById('selectImprimirEmpleado').value;
            if (!empVal) {
                showToast('Debe seleccionar un empleado.', 'error');
                return;
            }
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalImprimirEmpleado'));
            if (modalInstance) modalInstance.hide();
            enviarEmpleadoWSP(parseInt(empVal, 10));
        });
    }

    // Modal de impresión por Cliente: poblar opciones al abrir
    const modalImprimirClienteEl = document.getElementById('modalImprimirCliente');
    if (modalImprimirClienteEl) {
        modalImprimirClienteEl.addEventListener('show.bs.modal', updateImprimirClienteSelect);
    }

    // Botón confirmar impresión por Cliente
    const btnConfirmarImprimirCliente = document.getElementById('btnConfirmarImprimirCliente');
    if (btnConfirmarImprimirCliente) {
        btnConfirmarImprimirCliente.addEventListener('click', () => {
            const ventaVal = document.getElementById('selectImprimirCliente').value;
            if (!ventaVal) {
                showToast('Debe seleccionar un pedido.', 'error');
                return;
            }
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalImprimirCliente'));
            if (modalInstance) modalInstance.hide();
            imprimirCliente(parseInt(ventaVal, 10));
        });
    }

    // Botón confirmar enviar por WhatsApp por Cliente
    const btnConfirmarEnviarClienteWSP = document.getElementById('btnConfirmarEnviarClienteWSP');
    if (btnConfirmarEnviarClienteWSP) {
        btnConfirmarEnviarClienteWSP.addEventListener('click', () => {
            const ventaVal = document.getElementById('selectImprimirCliente').value;
            if (!ventaVal) {
                showToast('Debe seleccionar un pedido.', 'error');
                return;
            }
            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalImprimirCliente'));
            if (modalInstance) modalInstance.hide();
            enviarClienteWSP(parseInt(ventaVal, 10));
        });
    }

    // Delegación de eventos para botón de imprimir y WhatsApp en la tabla de pedidos
    if (tablaPedidos) {
        tablaPedidos.addEventListener('click', (e) => {
            const btnPrint = e.target.closest('.btn-imprimir-fila');
            if (btnPrint) {
                const id = parseInt(btnPrint.getAttribute('data-id'), 10);
                imprimirCliente(id);
                return;
            }

            const btnWsp = e.target.closest('.btn-whatsapp-fila');
            if (btnWsp) {
                const id = parseInt(btnWsp.getAttribute('data-id'), 10);
                enviarClienteWSP(id);
            }
        });
    }

    // Al abrir el modal de visualización de detalles
    if (verPedidoModal) {
        verPedidoModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            const id = parseInt(button.getAttribute('data-id'), 10);
            
            const venta = ventas.find(v => v.id === id);
            if (!venta) {
                console.error('No se encontró el pedido:', id);
                return;
            }

            const clienteName = venta.clienteNombre || 'Cliente Desconocido';
            const empleadoName = venta.empleadoNombre && venta.empleadoApellido
                ? `${venta.empleadoNombre} ${venta.empleadoApellido}`
                : (venta.empleadoNombre || 'N/A');

            verPedidoCliente.textContent = clienteName;
            verPedidoEmpleado.textContent = empleadoName;
            verPedidoFecha.textContent = venta.fechaEmision || 'N/A';

            // Configurar badge de estado
            if (venta.activo) {
                verPedidoEstadoBadge.className = 'badge bg-success';
                verPedidoEstadoBadge.textContent = 'Activo';
            } else {
                verPedidoEstadoBadge.className = 'badge bg-danger';
                verPedidoEstadoBadge.textContent = 'Cancelado';
            }

            // Renderizar la tabla de productos de la venta
            verPedidoDetallesBody.innerHTML = '';
            if (!venta.detalles || venta.detalles.length === 0) {
                verPedidoDetallesBody.innerHTML = '<tr><td colspan="4" class="text-secondary py-3">No hay productos registrados en este pedido</td></tr>';
            } else {
                venta.detalles.forEach(d => {
                    const product = productos.find(p => p.id === d.productoId);
                    const productName = product 
                        ? `${escapeHtml(product.nombre)} (${escapeHtml(product.marca)})` 
                        : `Producto #${d.productoId}`;
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="text-white text-start">${productName}</td>
                        <td class="text-white">$${formatCurrency(d.precio)}</td>
                        <td class="text-white">${d.cantidad}</td>
                        <td class="text-white">$${formatCurrency(d.subtotal)}</td>
                    `;
                    verPedidoDetallesBody.appendChild(tr);
                });
            }

            verPedidoTotal.textContent = `$${formatCurrency(venta.total)}`;
        });
    }

    // Al abrir el modal de edición de estado y detalles
    if (editPedidoModal) {
        editPedidoModal.addEventListener('show.bs.modal', (event) => {
            const button = event.relatedTarget;
            const id = parseInt(button.getAttribute('data-id'), 10);
            
            const venta = ventas.find(v => v.id === id);
            if (!venta) {
                console.error('No se encontró el pedido:', id);
                return;
            }

            currentClienteEdicion = clientes.find(c => c.id === venta.clienteId);

            editPedidoId.value = venta.id;
            editPedidoCliente.value = venta.clienteNombre || 'Cliente Desconocido';
            editPedidoEstado.value = venta.activo ? 'activo' : 'inactivo';

            // Clonar los detalles de la venta en nuestro listado de edición
            detallesEdicion = venta.detalles.map(d => {
                const product = productos.find(p => p.id === d.productoId);
                return {
                    productoId: d.productoId,
                    precioId: d.precioId,
                    nombre: product ? `${product.nombre} (${product.marca})` : `Producto #${d.productoId}`,
                    precio: d.precio,
                    cantidad: d.cantidad,
                    subtotal: d.subtotal
                };
            });

            // Limpiar campos de agregado en edición
            const editMarcaInput = document.getElementById('editMarcaSelect');
            if (editMarcaInput) {
                editMarcaInput.value = '';
            }
            const editProductInput = document.getElementById('editProductoSelect');
            if (editProductInput) {
                editProductInput.value = '';
                editProductInput.comboboxOptions = productos.map(p => p.nombre);
            }
            document.getElementById('editProductoCantidad').value = '1';

            renderDetallesEdicion();
        });
    }

    // Al hacer click en guardar cambios del pedido en edición
    if (btnActualizarPedido) {
        btnActualizarPedido.addEventListener('click', async () => {
            const id = editPedidoId.value;
            const activo = editPedidoEstado.value === 'activo';

            if (detallesEdicion.length === 0) {
                showToast('Debe tener al menos un producto agregado al pedido.', 'error');
                return;
            }

            const payload = {
                activo,
                detalles: detallesEdicion.map(d => ({
                    productoId: d.productoId,
                    precioId: d.precioId,
                    cantidad: d.cantidad,
                    precio: d.precio
                }))
            };

            try {
                btnActualizarPedido.disabled = true;
                console.log(`Guardando cambios en pedido ${id}:`, payload);
                await apiClient.put(`/ventas/${id}`, payload);
                
                showToast('Pedido actualizado correctamente.');
                modalEditarPedido.hide();
                await cargarVentas();
            } catch (error) {
                console.error('Error al actualizar pedido:', error);
                showToast(error.message || 'Hubo un error al actualizar el pedido.', 'error');
            } finally {
                btnActualizarPedido.disabled = false;
            }
        });
    }

    // Limpiar formulario al cerrar el modal de creación
    const addModalEl = document.getElementById('addPedidoModal');
    if (addModalEl) {
        // Recargar la lista de clientes al abrir el modal para incluir
        // clientes creados recientemente en la misma sesión
        addModalEl.addEventListener('show.bs.modal', () => {
            recargarClientes();
        });

        addModalEl.addEventListener('hidden.bs.modal', () => {
            formAgregarPedido.reset();
            detallesTemporales = [];
            renderDetallesTemporales();
            // Restablecer las opciones de todos los productos en el combobox
            const productInput = document.getElementById('productoSelect');
            if (productInput) {
                productInput.comboboxOptions = productos.map(p => p.nombre);
            }
            // Ocultar botón de repetir último pedido
            const btnRepetir = document.getElementById('btnRepetirUltimoPedido');
            if (btnRepetir) btnRepetir.classList.add('d-none');
            // Cerrar dropdowns de combobox abiertos
            document.querySelectorAll('.combobox-dropdown').forEach(d => d.classList.add('d-none'));
            document.querySelectorAll('.custom-combobox-container').forEach(c => c.classList.remove('open'));
        });
    }

    // Limpiar formulario al cerrar el modal de edición
    const editModalEl = document.getElementById('editPedidoModal');
    if (editModalEl) {
        editModalEl.addEventListener('hidden.bs.modal', () => {
            document.getElementById('editPedidoForm').reset();
            detallesEdicion = [];
            currentClienteEdicion = null;
            const editProductInput = document.getElementById('editProductoSelect');
            if (editProductInput) {
                editProductInput.comboboxOptions = productos.map(p => p.nombre);
            }
            // Cerrar dropdowns de combobox abiertos
            document.querySelectorAll('.combobox-dropdown').forEach(d => d.classList.add('d-none'));
            document.querySelectorAll('.custom-combobox-container').forEach(c => c.classList.remove('open'));
        });
    }

    // Buscador con Debounce
    const searchInput = document.getElementById('pedidoSearchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                renderVentasTable(searchInput.value);
            }, 300);
        });
    }

    // Filtro de Fechas
    const fechaMinEl = document.getElementById('fechaMinInput');
    const fechaMaxEl = document.getElementById('fechaMaxInput');
    const btnFechaHoy = document.getElementById('btnFechaHoy');

    if (fechaMinEl) {
        fechaMinEl.addEventListener('change', () => {
            cargarVentas();
        });
    }
    if (fechaMaxEl) {
        fechaMaxEl.addEventListener('change', () => {
            cargarVentas();
        });
    }
    if (btnFechaHoy) {
        btnFechaHoy.addEventListener('click', () => {
            const todayStr = getLocalDateStr();
            if (fpMin) fpMin.setDate(todayStr);
            if (fpMax) fpMax.setDate(todayStr);
            cargarVentas();
        });
    }
}

/**
 * Crea un combobox de búsqueda interactivo sobre un input de texto.
 * Permite tanto escribir para filtrar como desplegar las opciones al hacer clic/foco.
 */
function inicializarCombobox(inputId, optionsList, onSelectCallback = null) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const container = input.parentElement;
    container.classList.add('custom-combobox-container');

    // Agregar flecha de desplegable
    let chevron = container.querySelector('.combobox-chevron');
    if (!chevron) {
        chevron = document.createElement('span');
        chevron.className = 'combobox-chevron';
        chevron.innerHTML = '<i class="fas fa-chevron-down"></i>';
        container.appendChild(chevron);
    }

    // Agregar contenedor para la lista de opciones
    let dropdown = container.querySelector('.combobox-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'combobox-dropdown d-none';
        container.appendChild(dropdown);
    }

    function populateDropdown(filterText = '') {
        const currentOptions = input.comboboxOptions || optionsList;
        const filtered = currentOptions.filter(opt => 
            opt.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            dropdown.innerHTML = '<div class="combobox-no-results">No se encontraron resultados</div>';
            return;
        }

        const maxVisible = 30;
        const sliced = filtered.slice(0, maxVisible);
        let itemsHtml = sliced.map(opt => 
            `<div class="combobox-item" data-value="${opt}">${opt}</div>`
        ).join('');

        if (filtered.length > maxVisible) {
            itemsHtml += `<div class="combobox-more-results text-center py-2 text-muted" style="font-size: 0.8rem; border-top: 1px solid var(--border-color, #444); background: var(--bg-card, #2d2d2d);">Mostrando ${maxVisible} de ${filtered.length} (escribí para buscar)</div>`;
        }

        dropdown.innerHTML = itemsHtml;

        dropdown.querySelectorAll('.combobox-item').forEach(item => {
            item.addEventListener('click', (e) => {
                input.value = item.getAttribute('data-value');
                closeDropdown();
                if (onSelectCallback) {
                    onSelectCallback(input.value);
                }
                // Disparar eventos nativos para que reaccionen los scripts del DOM
                input.dispatchEvent(new Event('change'));
                input.dispatchEvent(new Event('input'));
            });
        });
    }

    function openDropdown() {
        // Cerrar otros dropdowns primero
        document.querySelectorAll('.combobox-dropdown').forEach(d => {
            if (d !== dropdown) d.classList.add('d-none');
        });
        document.querySelectorAll('.custom-combobox-container').forEach(c => {
            if (c !== container) c.classList.remove('open');
        });

        container.classList.add('open');
        dropdown.classList.remove('d-none');
        populateDropdown(input.value);
    }

    function closeDropdown() {
        container.classList.remove('open');
        dropdown.classList.add('d-none');
    }

    input.addEventListener('click', (e) => {
        e.stopPropagation();
        openDropdown();
    });

    input.addEventListener('focus', () => {
        openDropdown();
    });

    input.addEventListener('input', () => {
        openDropdown();
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            closeDropdown();
        }
    });
}



/**
 * Inicialización de la aplicación
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Página de pedidos cargada. Inicializando...');
    if (inicializarElementos()) {
        await cargarDatosAuxiliares();
        inicializarFiltroFechas();
        await cargarVentas();
        inicializarEventos();
    }
});
