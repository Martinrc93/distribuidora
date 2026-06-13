import { apiClient } from '../../api/apiClient.js';

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
        const [respClientes, respEmpleados, respProductos, respMarcas] = await Promise.all([
            apiClient.get('/clientes'),
            apiClient.get('/empleados'),
            apiClient.get('/products/all'),
            apiClient.get('/marcas/all')
        ]);

        clientes = respClientes?.data || [];
        empleados = respEmpleados?.data || [];
        productos = Array.isArray(respProductos) ? respProductos : (respProductos?.data || []);
        marcas = Array.isArray(respMarcas) ? respMarcas : (respMarcas?.data || []);

        // Inicializar comboboxes de búsqueda interactivos
        inicializarCombobox('pedidoEmpleado', empleados.filter(e => e.active).map(e => `${e.nombre} ${e.apellido}`));
        inicializarCombobox('pedidoCliente', clientes.map(c => c.nombre));
        inicializarCombobox('editProductoSelect', productos.map(p => p.nombre));

        // Inicializar combobox de marcas con callback para filtrar productos
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

        // Escuchar cuando el input de marca se limpie o modifique manualmente
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

        // Inicializar combobox de productos
        inicializarCombobox('productoSelect', productos.map(p => p.nombre));

        console.log('Datos auxiliares cargados.');
    } catch (error) {
        console.error('Error al cargar datos auxiliares:', error);
    }
}

/**
 * Carga las ventas/pedidos del backend filtrando por la fecha de hoy
 */
async function cargarVentas() {
    try {
        console.log('Cargando pedidos/ventas del día...');
        tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3"><i class="fas fa-spinner fa-spin"></i> Cargando pedidos...</td></tr>';
        
        // Obtener la fecha local de hoy en formato YYYY-MM-DD
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Hacemos el fetch mandando el filtro de día
        const respuesta = await apiClient.get(`/ventas?limit=100&dia=${todayStr}`);
        
        if (!respuesta || !respuesta.data) {
            console.error('Respuesta inválida:', respuesta);
            tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error: Respuesta inválida del servidor</td></tr>';
            return;
        }
        
        ventas = respuesta.data;
        console.log('Pedidos cargados hoy:', ventas);

        tablaPedidos.innerHTML = '';

        if (ventas.length === 0) {
            tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-secondary py-3">No hay pedidos registrados el día de hoy</td></tr>';
            return;
        }

        // Ordenar: Activos (active = true) primero, Cancelados (active = false) después
        ventas.sort((a, b) => {
            if (a.active && !b.active) return -1;
            if (!a.active && b.active) return 1;
            return 0;
        });

        ventas.forEach(venta => {
            const clienteName = venta.clienteNombre || 'Cliente Desconocido';
            const estadoBadge = venta.active 
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-danger">Cancelado</span>';
                
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${clienteName}</td>
                <td>${venta.fechaEmision || 'N/A'}</td>
                <td>$${Number(venta.total).toFixed(2)}</td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-sm action-btn border-0 btn-ver" data-id="${venta.id}" data-bs-toggle="modal" data-bs-target="#verPedidoModal" title="Ver Detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm action-btn border-0 btn-editar" data-id="${venta.id}" data-active="${venta.active}" data-bs-toggle="modal" data-bs-target="#editPedidoModal" title="Editar Pedido">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tablaPedidos.appendChild(fila);
        });

    } catch (error) {
        console.error('Error al cargar ventas:', error);
        tablaPedidos.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Error al cargar pedidos: ${error.message}</td></tr>`;
    }
}

/**
 * Agrega un producto a la lista temporal en el modal de creación
 */
async function agregarProductoTemporal() {
    const clientName = document.getElementById('pedidoCliente').value.trim();
    const productName = document.getElementById('productoSelect').value.trim();
    const cantidad = parseFloat(document.getElementById('productoCantidad').value);

    if (isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor, ingrese una cantidad mayor a 0.');
        return;
    }

    if (!clientName) {
        alert('Debe seleccionar primero un cliente para obtener su lista de precios.');
        return;
    }

    const client = clientes.find(c => c.nombre === clientName);
    if (!client) {
        alert('El cliente ingresado no es válido. Por favor, selecciónelo de la lista.');
        return;
    }

    const product = productos.find(p => p.nombre === productName);
    if (!product) {
        alert('El producto ingresado no es válido. Por favor, selecciónelo de la lista.');
        return;
    }

    try {
        btnAgregarProducto.disabled = true;
        
        // Obtener los precios del producto
        const respPrecios = await apiClient.get(`/prices/product/${product.id}`);
        const prices = Array.isArray(respPrecios) ? respPrecios : (respPrecios?.data || []);
        
        const clientListId = client.listaPreciosId || 1;
        const priceRecord = prices.find(p => p.listaPreciosId === clientListId);

        if (!priceRecord) {
            alert(`No se encontró un precio para este producto en la Lista de Precios ${clientListId} del cliente.`);
            btnAgregarProducto.disabled = false;
            return;
        }

        const existingIndex = detallesTemporales.findIndex(d => d.productId === product.id);
        if (existingIndex !== -1) {
            detallesTemporales[existingIndex].cantidad += cantidad;
            detallesTemporales[existingIndex].subtotal = parseFloat((detallesTemporales[existingIndex].cantidad * detallesTemporales[existingIndex].precio).toFixed(2));
        } else {
            detallesTemporales.push({
                productId: product.id,
                priceId: priceRecord.id,
                nombre: product.nombre,
                precio: priceRecord.precio,
                cantidad: cantidad,
                subtotal: parseFloat((cantidad * priceRecord.precio).toFixed(2))
            });
        }

        renderDetallesTemporales();
        
        // Limpiar inputs de producto
        document.getElementById('productoSelect').value = '';
        document.getElementById('productoCantidad').value = '1';
    } catch (error) {
        console.error('Error al agregar producto al pedido:', error);
        alert('Error al consultar el precio del producto.');
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
            <td>${d.nombre}</td>
            <td>$${d.precio.toFixed(2)}</td>
            <td>${d.cantidad}</td>
            <td>$${d.subtotal.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm action-btn delete border-0 btn-eliminar-item" data-index="${idx}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tablaPedidoDetallesBody.appendChild(tr);
    });

    pedidoTotalLabel.textContent = `$${total.toFixed(2)}`;

    // Agregar manejadores de eventos para eliminar ítems
    document.querySelectorAll('.btn-eliminar-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'), 10);
            detallesTemporales.splice(index, 1);
            renderDetallesTemporales();
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
        alert('Debe seleccionar un empleado válido.');
        return;
    }

    const client = clientes.find(c => c.nombre === clientName);
    if (!client) {
        alert('Debe seleccionar un cliente válido.');
        return;
    }

    if (detallesTemporales.length === 0) {
        alert('Debe agregar al menos un producto al pedido antes de confirmar.');
        return;
    }

    const payload = {
        empleadoId: employee.id,
        clienteId: client.id,
        detalles: detallesTemporales.map(d => ({
            productId: d.productId,
            priceId: d.priceId,
            cantidad: d.cantidad
        }))
    };

    try {
        btnConfirmarPedido.disabled = true;
        console.log('Creando pedido:', payload);
        await apiClient.post('/ventas', payload);
        
        alert('Pedido creado exitosamente.');
        modalAgregarPedido.hide();
        await cargarVentas();
    } catch (error) {
        console.error('Error al crear pedido:', error);
        alert('Error al registrar el pedido: ' + (error.data?.errores?.[0] || error.data?.error || error.message));
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

    if (isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor, ingrese una cantidad mayor a 0.');
        return;
    }

    if (!currentClienteEdicion) {
        alert('Error: cliente de edición no inicializado.');
        return;
    }

    const product = productos.find(p => p.nombre === productName);
    if (!product) {
        alert('El producto ingresado no es válido. Por favor, selecciónelo de la lista.');
        return;
    }

    try {
        btnEditAgregarProducto.disabled = true;
        
        // Obtener los precios del producto
        const respPrecios = await apiClient.get(`/prices/product/${product.id}`);
        const prices = Array.isArray(respPrecios) ? respPrecios : (respPrecios?.data || []);
        
        const clientListId = currentClienteEdicion.listaPreciosId || 1;
        const priceRecord = prices.find(p => p.listaPreciosId === clientListId);

        if (!priceRecord) {
            alert(`No se encontró un precio para este producto en la Lista de Precios ${clientListId} del cliente.`);
            btnEditAgregarProducto.disabled = false;
            return;
        }

        const existingIndex = detallesEdicion.findIndex(d => d.productId === product.id);
        if (existingIndex !== -1) {
            detallesEdicion[existingIndex].cantidad += cantidad;
            detallesEdicion[existingIndex].subtotal = parseFloat((detallesEdicion[existingIndex].cantidad * detallesEdicion[existingIndex].precio).toFixed(2));
        } else {
            detallesEdicion.push({
                productId: product.id,
                priceId: priceRecord.id,
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
    } catch (error) {
        console.error('Error al agregar producto al pedido en edición:', error);
        alert('Error al consultar el precio del producto.');
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
            <td>${d.nombre}</td>
            <td>$${d.precio.toFixed(2)}</td>
            <td>
                <input type="number" min="0.5" step="0.5" class="form-control text-center mx-auto edit-item-qty" style="width: 80px; height: 32px !important; padding: 0.2rem !important; font-size: 0.95rem !important;" data-index="${idx}" value="${d.cantidad}">
            </td>
            <td>$${d.subtotal.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-sm action-btn delete border-0 btn-eliminar-item-edicion" data-index="${idx}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        editPedidoDetallesBody.appendChild(tr);
    });

    editPedidoTotalLabel.textContent = `$${total.toFixed(2)}`;

    // Manejador para eliminar ítems en edición
    document.querySelectorAll('.btn-eliminar-item-edicion').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'), 10);
            detallesEdicion.splice(index, 1);
            renderDetallesEdicion();
        });
    });

    // Manejador para cambiar la cantidad en edición
    document.querySelectorAll('.edit-item-qty').forEach(input => {
        input.addEventListener('change', () => {
            const index = parseInt(input.getAttribute('data-index'), 10);
            const val = parseFloat(input.value);
            if (!isNaN(val) && val > 0) {
                detallesEdicion[index].cantidad = val;
                detallesEdicion[index].subtotal = parseFloat((val * detallesEdicion[index].precio).toFixed(2));
                renderDetallesEdicion();
            } else {
                input.value = detallesEdicion[index].cantidad;
            }
        });
    });
}

/**
 * Agrupa todos los pedidos activos de hoy y genera el ticket consolidado para depósito.
 */
function imprimirConsolidado() {
    const consolidado = {};
    
    // Sumar cantidades por producto únicamente para ventas activas
    ventas.forEach(venta => {
        if (!venta.active) return;
        
        venta.detalles.forEach(d => {
            const product = productos.find(p => p.id === d.productId);
            const productName = product ? `${product.nombre} (${product.marca})` : `Producto #${d.productId}`;
            
            if (consolidado[productName]) {
                consolidado[productName] += d.cantidad;
            } else {
                consolidado[productName] = d.cantidad;
            }
        });
    });

    const items = Object.entries(consolidado).map(([nombre, cantidad]) => ({ nombre, cantidad }));

    if (items.length === 0) {
        alert('No hay pedidos activos registrados el día de hoy para enviar al depósito.');
        return;
    }

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const folioStr = today.toISOString().split('T')[0].replace(/-/g, '');

    // Rellenar datos en la sección de impresión en el DOM actual
    document.getElementById('printFolio').textContent = folioStr;
    document.getElementById('printFecha').textContent = formattedDate;

    const printTableBody = document.getElementById('printTableBody');
    printTableBody.innerHTML = items.map(item => `
        <tr>
            <td># ${item.nombre.toUpperCase()}</td>
            <td class="cant-cell">${item.cantidad}</td>
        </tr>
    `).join('');

    // Invocar el diálogo de impresión directamente en la misma pestaña
    window.print();
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

    // Evento para imprimir consolidado para depósito
    const btnImprimirDeposito = document.getElementById('btnImprimirDeposito');
    if (btnImprimirDeposito) {
        btnImprimirDeposito.addEventListener('click', imprimirConsolidado);
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
            if (venta.active) {
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
                    const product = productos.find(p => p.id === d.productId);
                    const productName = product ? `${product.nombre} (${product.marca})` : `Producto #${d.productId}`;
                    
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="text-white text-start">${productName}</td>
                        <td class="text-white">$${Number(d.precio).toFixed(2)}</td>
                        <td class="text-white">${d.cantidad}</td>
                        <td class="text-white">$${Number(d.subtotal).toFixed(2)}</td>
                    `;
                    verPedidoDetallesBody.appendChild(tr);
                });
            }

            verPedidoTotal.textContent = `$${Number(venta.total).toFixed(2)}`;
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
            editPedidoEstado.value = venta.active ? 'activo' : 'inactivo';

            // Clonar los detalles de la venta en nuestro listado de edición
            detallesEdicion = venta.detalles.map(d => {
                const product = productos.find(p => p.id === d.productId);
                return {
                    productId: d.productId,
                    priceId: d.priceId,
                    nombre: product ? `${product.nombre} (${product.marca})` : `Producto #${d.productId}`,
                    precio: d.precio,
                    cantidad: d.cantidad,
                    subtotal: d.subtotal
                };
            });

            renderDetallesEdicion();
        });
    }

    // Al hacer click en guardar cambios del pedido en edición
    if (btnActualizarPedido) {
        btnActualizarPedido.addEventListener('click', async () => {
            const id = editPedidoId.value;
            const active = editPedidoEstado.value === 'activo';

            if (detallesEdicion.length === 0) {
                alert('Debe tener al menos un producto agregado al pedido.');
                return;
            }

            const payload = {
                active,
                detalles: detallesEdicion.map(d => ({
                    productId: d.productId,
                    priceId: d.priceId,
                    cantidad: d.cantidad
                }))
            };

            try {
                btnActualizarPedido.disabled = true;
                console.log(`Guardando cambios en pedido ${id}:`, payload);
                await apiClient.put(`/ventas/${id}`, payload);
                
                alert('Pedido actualizado correctamente.');
                modalEditarPedido.hide();
                await cargarVentas();
            } catch (error) {
                console.error('Error al actualizar pedido:', error);
                alert('Error al actualizar el pedido: ' + (error.data?.error || error.message));
            } finally {
                btnActualizarPedido.disabled = false;
            }
        });
    }

    // Limpiar formulario al cerrar el modal de creación
    const addModalEl = document.getElementById('addPedidoModal');
    if (addModalEl) {
        addModalEl.addEventListener('hidden.bs.modal', () => {
            formAgregarPedido.reset();
            detallesTemporales = [];
            renderDetallesTemporales();
            // Restablecer las opciones de todos los productos en el combobox
            const productInput = document.getElementById('productoSelect');
            if (productInput) {
                productInput.comboboxOptions = productos.map(p => p.nombre);
            }
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
            // Cerrar dropdowns de combobox abiertos
            document.querySelectorAll('.combobox-dropdown').forEach(d => d.classList.add('d-none'));
            document.querySelectorAll('.custom-combobox-container').forEach(c => c.classList.remove('open'));
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

        dropdown.innerHTML = filtered.map(opt => 
            `<div class="combobox-item" data-value="${opt}">${opt}</div>`
        ).join('');

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
        await cargarVentas();
        inicializarEventos();
    }
});
