// Archivo principal de JavaScript para el Frontend Estático
// Aquí programaremos las peticiones a la API local (fetch a http://localhost:3000)
// y la manipulación del DOM.

// Variables Globales para el Modal de Recorridos
let empleadoIdSeleccionado = null;
let carritoRemito = [];
let productoIdActivoPrecios = null;
let pedidosGlobales = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarEmpleados();
    configurarPestanas();
    configurarEventosModal();
    configurarEventosCarrito();
    configurarEventosProductos();
    configurarEventosPedidos();
});

/**
 * Realiza una petición GET a la API local para obtener los empleados
 * y renderiza los datos en la tabla principal.
 */
async function cargarEmpleados() {
    try {
        // Al servirse desde el mismo origen, usamos una ruta relativa.
        const response = await fetch('/api/empleados');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const empleados = await response.json();
        
        // Imprimimos en consola para depurar exactamente qué nos devolvió el backend
        console.log('Datos recibidos:', empleados);

        const tbody = document.querySelector('#tabla-empleados tbody');
        
        // Limpiamos la tabla por si había contenido previo
        tbody.innerHTML = '';

        // Si recibimos un array vacío o algo que no es un array, mostramos un mensaje amigable
        if (!Array.isArray(empleados) || empleados.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No hay empleados registrados.</td></tr>`;
            return; // Cortamos la ejecución para que no intente hacer el forEach
        }

        // Recorremos el array de empleados inyectando el HTML correspondiente
        empleados.forEach(empleado => {
            const fila = document.createElement('tr');
            
            fila.innerHTML = `
                <td>${empleado.nombreCompleto}</td>
                <td>0</td>
                <td>$0.00</td>
                <td>$0.00</td>
                <td class="col-action">
                    <button class="btn-registrar" data-id="${empleado.id}" data-nombre="${empleado.nombreCompleto}">Registrar Recorrido</button>
                </td>
            `;
            
            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar los empleados:', error);
        const tbody = document.querySelector('#tabla-empleados tbody');
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #cc0000; padding: 20px;">Error al cargar los datos. Verifica que el servidor (app.js) esté corriendo.</td></tr>`;
    }
}

/**
 * Configura la navegación dinámica entre las pestañas superiores
 */
function configurarPestanas() {
    const pestanas = document.querySelectorAll('.tab');
    const pantallas = document.querySelectorAll('.pantalla');

    pestanas.forEach(pestana => {
        pestana.addEventListener('click', (e) => {
            e.preventDefault(); // Evita que la página suba al inicio por el href="#"

            // 1. Quitar la clase 'active' de todos los botones
            pestanas.forEach(p => p.classList.remove('active'));
            
            // 2. Ocultar todas las pantallas
            pantallas.forEach(pantalla => pantalla.style.display = 'none');

            // 3. Activar el botón presionado
            pestana.classList.add('active');

            // 4. Mostrar la pantalla correspondiente a través de su data-target
            const targetId = pestana.getAttribute('data-target');
            const targetPantalla = document.getElementById(targetId);
            if (targetPantalla) {
                targetPantalla.style.display = 'block';
                if (targetId === 'seccion-productos') {
                    cargarProductos();
                } else if (targetId === 'seccion-pedidos') {
                    cargarPedidos();
                }
            }
        });
    });
}

/**
 * Configura la delegación de eventos y los botones del Modal de Recorrido
 */
function configurarEventosModal() {
    // Event Delegation: Escuchar clicks dentro de la tabla padre
    document.getElementById('tabla-empleados').addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-registrar')) {
            empleadoIdSeleccionado = e.target.getAttribute('data-id');
            const nombreEmpleado = e.target.getAttribute('data-nombre');
            
            document.getElementById('nombre-empleado-modal').textContent = nombreEmpleado;
            document.getElementById('modal-recorrido').style.display = 'flex'; // o 'block'
            
            // Aquí va el fetch a /api/productos para llenar el select
            await cargarProductosModal();
        }
    });

    // Configurar botón "Cancelar"
    document.getElementById('btn-cancelar-modal').addEventListener('click', () => {
        document.getElementById('modal-recorrido').style.display = 'none';
        empleadoIdSeleccionado = null;
        carritoRemito = [];
        renderizarCarrito(); // Limpiar visualmente el carrito al cancelar
    });
}

/**
 * Realiza un fetch a la API para obtener el catálogo de productos
 * y llena el select del Modal.
 */
async function cargarProductosModal() {
    const selectProducto = document.getElementById('select-producto');
    selectProducto.innerHTML = '<option value="" disabled selected>Cargando productos...</option>';

    try {
        const response = await fetch('/api/productos');
        if (!response.ok) throw new Error('Error al obtener productos del servidor');
        
        const productos = await response.json();
        selectProducto.innerHTML = '<option value="" disabled selected>Seleccione un producto</option>';
        
        productos.forEach(prod => {
            selectProducto.innerHTML += `<option value="${prod.id}">${prod.nombre} (${prod.marca})</option>`;
        });
    } catch (error) {
        console.error('Error al cargar productos:', error);
        selectProducto.innerHTML = '<option value="" disabled selected>Error al cargar el catálogo</option>';
    }
}

/**
 * Configura los eventos específicos para la gestión del carrito (agregar, confirmar y eliminar)
 */
function configurarEventosCarrito() {
    const btnAgregar = document.getElementById('btn-agregar-remito');
    const btnConfirmar = document.getElementById('btn-confirmar-recorrido');
    const tablaRemito = document.getElementById('tabla-remito');

    // 1. Evento Agregar al Carrito
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            const selectProd = document.getElementById('select-producto');
            const inputCant = document.getElementById('input-cantidad');
            const selectLista = document.getElementById('select-lista'); // Asumiendo que existe un select para la lista

            const productoId = selectProd.value;
            const productoNombre = selectProd.options[selectProd.selectedIndex]?.text;
            const cantidad = parseInt(inputCant?.value || 0, 10);
            
            // Obtenemos el número de la lista elegida para simular el precio (fallback a 1 si no existe)
            const numListaStr = selectLista ? selectLista.value : '1';
            const numeroLista = parseInt(numListaStr.replace(/\D/g, '') || 1, 10);

            // Validaciones
            if (!productoId) {
                return alert('Por favor, seleccione un producto.');
            }
            if (cantidad <= 0 || isNaN(cantidad)) {
                return alert('La cantidad debe ser mayor a 0.');
            }

            // Simulación temporal de precio (Precio base $1000 x N° Lista)
            const precioSimulado = 1000 * numeroLista;
            const subtotal = precioSimulado * cantidad;

            // Creamos el ítem usando un ID temporal único para poder eliminarlo después
            const nuevoItem = {
                idTmp: Date.now(),
                productoId: parseInt(productoId, 10),
                productoNombre: productoNombre,
                cantidad: cantidad,
                precioListaSeleccionado: `precioLista${numeroLista}`,
                precio: precioSimulado,
                subtotal: subtotal
            };

            carritoRemito.push(nuevoItem);
            renderizarCarrito();

            // Resetear inputs tras agregar
            selectProd.value = '';
            if (inputCant) inputCant.value = '';
            if (selectLista) selectLista.value = '1';
        });
    }

    // 2. Evento Confirmar Recorrido (POST)
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            if (carritoRemito.length === 0) {
                return alert('El remito debe tener al menos un producto para confirmar el recorrido.');
            }

            const payload = {
                empleadoId: empleadoIdSeleccionado,
                total: calcularTotalCarrito(),
                items: carritoRemito.map(item => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    subtotal: item.subtotal,
                    precioListaSeleccionado: item.precioListaSeleccionado
                }))
            };

            try {
                const response = await fetch('/api/pedidos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || `Error HTTP: ${response.status}`);
                }

                alert('Recorrido registrado con éxito');

                // Reseteo general tras el éxito
                carritoRemito = [];
                renderizarCarrito();
                document.getElementById('modal-recorrido').style.display = 'none';
                empleadoIdSeleccionado = null;
                
                // Recargar el fondo para ver los totales actualizados del empleado
                cargarEmpleados();

            } catch (error) {
                console.error('Error al confirmar el pedido:', error);
                alert('Hubo un error al registrar el recorrido: ' + error.message);
            }
        });
    }

    // 3. Delegación de eventos para el botón "Eliminar" del carrito
    if (tablaRemito) {
        tablaRemito.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-eliminar-item') || e.target.closest('.btn-eliminar-item')) {
                const btn = e.target.classList.contains('btn-eliminar-item') ? e.target : e.target.closest('.btn-eliminar-item');
                const idTmp = parseInt(btn.getAttribute('data-id'), 10);
                
                // Filtramos el array para quitar el ítem
                carritoRemito = carritoRemito.filter(item => item.idTmp !== idTmp);
                renderizarCarrito();
            }
        });
    }
}

/**
 * Renderiza el array del carrito en el HTML y actualiza el Total
 */
function renderizarCarrito() {
    const tbody = document.querySelector('#tabla-remito tbody');
    const totalElement = document.getElementById('total-general-remito') || document.getElementById('total-remito');
    
    if (!tbody) return;

    tbody.innerHTML = '';
    let totalGral = 0;

    if (carritoRemito.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 15px;">No hay productos en el remito.</td></tr>`;
    } else {
        carritoRemito.forEach(item => {
            totalGral += item.subtotal;

            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${item.productoNombre}</td>
                <td>${item.cantidad}</td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
                <td style="text-align: center;">
                    <button type="button" class="btn-eliminar-item" data-id="${item.idTmp}" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">
                        X
                    </button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    }

    // Actualizamos el label del total general si existe
    if (totalElement) {
        totalElement.textContent = `$${totalGral.toFixed(2)}`;
    }
}

/**
 * Realiza una petición GET a la API local para obtener los productos
 * y los renderiza en la tabla de la pestaña de productos.
 */
async function cargarProductos() {
    try {
        const response = await fetch('/api/productos');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const productos = await response.json();
        const tbody = document.querySelector('#tabla-productos tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!Array.isArray(productos) || productos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No hay productos registrados.</td></tr>`;
            return;
        }

        productos.forEach(producto => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>${producto.marca}</td>
                <td>$${parseFloat(producto.costo).toFixed(2)}</td>
                <td class="col-action" style="width: 250px; text-align: center;">
                    <button class="btn-precios" data-id="${producto.id}" data-nombre="${producto.nombre}" data-marca="${producto.marca}">Precios</button>
                    <button class="btn-eliminar" data-id="${producto.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        const tbody = document.querySelector('#tabla-productos tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #cc0000; padding: 20px;">Error al cargar los datos de productos.</td></tr>`;
        }
    }
}

/**
 * Configura los eventos para la pestaña de gestión de productos y su modal.
 */
function configurarEventosProductos() {
    const btnNuevoProducto = document.getElementById('btn-nuevo-producto');
    const modalProducto = document.getElementById('modal-producto');
    const formProducto = document.getElementById('form-producto');
    const btnCancelarProducto = document.getElementById('btn-cancelar-producto');
    const tablaProductos = document.getElementById('tabla-productos');

    // Elementos del Modal de Precios
    const modalPrecios = document.getElementById('modal-precios');
    const btnCerrarPrecios = document.getElementById('btn-cerrar-precios');
    const formPrecios = document.getElementById('form-precios');

    if (!modalProducto || !formProducto) return;

    // 1. Abrir modal para crear nuevo producto
    if (btnNuevoProducto) {
        btnNuevoProducto.addEventListener('click', () => {
            document.getElementById('titulo-modal-producto').textContent = 'Nuevo Producto';
            document.getElementById('input-producto-id').value = '';
            formProducto.reset();
            modalProducto.style.display = 'flex';
        });
    }

    // 2. Cerrar modal al hacer clic en cancelar
    if (btnCancelarProducto) {
        btnCancelarProducto.addEventListener('click', () => {
            modalProducto.style.display = 'none';
            formProducto.reset();
        });
    }

    // 3. Delegación de eventos para la tabla de productos (Precios / Editar / Eliminar)
    if (tablaProductos) {
        tablaProductos.addEventListener('click', async (e) => {
            // Precios de producto (abrir modal precios)
            if (e.target.classList.contains('btn-precios')) {
                const id = e.target.getAttribute('data-id');
                const nombre = e.target.getAttribute('data-nombre');
                const marca = e.target.getAttribute('data-marca');
                
                productoIdActivoPrecios = parseInt(id, 10);
                
                document.getElementById('nombre-producto-precios').textContent = `${nombre} (${marca})`;
                
                if (modalPrecios) {
                    modalPrecios.style.display = 'flex';
                    cargarPreciosProducto(productoIdActivoPrecios);
                }
            }

            // Editar producto
            if (e.target.classList.contains('btn-editar')) {
                const id = e.target.getAttribute('data-id');
                try {
                    const response = await fetch(`/api/productos/${id}`);
                    if (!response.ok) {
                        throw new Error('No se pudo obtener el detalle del producto');
                    }
                    const producto = await response.json();
                    
                    document.getElementById('titulo-modal-producto').textContent = 'Editar Producto';
                    document.getElementById('input-producto-id').value = producto.id;
                    document.getElementById('input-producto-nombre').value = producto.nombre;
                    document.getElementById('input-producto-marca').value = producto.marca;
                    document.getElementById('input-producto-costo').value = producto.costo;
                    
                    modalProducto.style.display = 'flex';
                } catch (error) {
                    console.error('Error al cargar producto para edición:', error);
                    alert('Error al cargar los datos del producto: ' + error.message);
                }
            }
            
            // Eliminar producto
            if (e.target.classList.contains('btn-eliminar')) {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Está seguro de que desea eliminar este producto?')) {
                    try {
                        const response = await fetch(`/api/productos/${id}`, {
                            method: 'DELETE'
                        });
                        
                        if (!response.ok) {
                            const errData = await response.json();
                            throw new Error(errData.mensaje || 'Error al eliminar el producto');
                        }
                        
                        alert('Producto eliminado exitosamente');
                        cargarProductos();
                      } catch (error) {
                          console.error('Error al eliminar producto:', error);
                          alert('No se pudo eliminar el producto: ' + error.message);
                      }
                  }
              }
          });
      }

      // 4. Enviar formulario de Producto (Crear / Actualizar)
      formProducto.addEventListener('submit', async (e) => {
          e.preventDefault();

          const id = document.getElementById('input-producto-id').value;
          const nombre = document.getElementById('input-producto-nombre').value;
          const marca = document.getElementById('input-producto-marca').value;
          const costo = document.getElementById('input-producto-costo').value;

          // Validaciones locales básicas
          if (!nombre.trim() || !marca.trim() || !costo) {
              alert('Todos los campos son obligatorios.');
              return;
          }

          const payload = {
              nombre: nombre,
              marca: marca,
              costo: costo
          };

          // Si es un nuevo producto (POST), agregamos los precios de las 7 listas
          if (!id) {
              payload.precios = {
                  lista1: document.getElementById('precio-lista-1').value !== '' ? parseFloat(document.getElementById('precio-lista-1').value) : null,
                  lista2: document.getElementById('precio-lista-2').value !== '' ? parseFloat(document.getElementById('precio-lista-2').value) : null,
                  lista3: document.getElementById('precio-lista-3').value !== '' ? parseFloat(document.getElementById('precio-lista-3').value) : null,
                  lista4: document.getElementById('precio-lista-4').value !== '' ? parseFloat(document.getElementById('precio-lista-4').value) : null,
                  lista5: document.getElementById('precio-lista-5').value !== '' ? parseFloat(document.getElementById('precio-lista-5').value) : null,
                  lista6: document.getElementById('precio-lista-6').value !== '' ? parseFloat(document.getElementById('precio-lista-6').value) : null,
                  lista7: document.getElementById('precio-lista-7').value !== '' ? parseFloat(document.getElementById('precio-lista-7').value) : null
              };
          }

          const url = id ? `/api/productos/${id}` : '/api/productos';
          const method = id ? 'PUT' : 'POST';

          try {
              const response = await fetch(url, {
                  method: method,
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(payload)
              });

              if (!response.ok) {
                  const errData = await response.json();
                  if (errData.errores && Array.isArray(errData.errores)) {
                      throw new Error(errData.errores.join('\n'));
                  }
                  throw new Error(errData.error || 'Error al guardar el producto.');
              }

              alert(id ? 'Producto actualizado con éxito' : 'Producto creado con éxito');
              modalProducto.style.display = 'none';
              formProducto.reset();
              cargarProductos();
          } catch (error) {
              console.error('Error al guardar producto:', error);
              alert('Error al guardar el producto:\n' + error.message);
          }
      });

      // 5. Cerrar modal de Precios
      if (btnCerrarPrecios && modalPrecios) {
          btnCerrarPrecios.addEventListener('click', () => {
              modalPrecios.style.display = 'none';
              productoIdActivoPrecios = null;
          });
      }

      // 6. Guardar Cambios del modal de precios
      if (formPrecios) {
          formPrecios.addEventListener('submit', async (e) => {
              e.preventDefault();
              if (!productoIdActivoPrecios) return;

              const costoVal = parseFloat(document.getElementById('modal-precios-costo').value);
              const lista1Val = document.getElementById('modal-precios-lista-1').value !== '' ? parseFloat(document.getElementById('modal-precios-lista-1').value) : 0;
              const lista2Val = document.getElementById('modal-precios-lista-2').value !== '' ? parseFloat(document.getElementById('modal-precios-lista-2').value) : 0;
              const lista3Val = document.getElementById('modal-precios-lista-3').value !== '' ? parseFloat(document.getElementById('modal-precios-lista-3').value) : 0;
              const lista4Val = document.getElementById('modal-precios-lista-4').value !== '' ? parseFloat(document.getElementById('modal-precios-lista-4').value) : 0;
              const lista5Val = document.getElementById('modal-precios-lista-5').value !== '' ? parseFloat(document.getElementById('modal-precios-lista-5').value) : 0;
              const lista6Val = document.getElementById('modal-precios-lista-6').value !== '' ? parseFloat(document.getElementById('modal-precios-lista-6').value) : 0;
              const lista7Val = document.getElementById('modal-precios-lista-7').value !== '' ? parseFloat(document.getElementById('modal-precios-lista-7').value) : 0;

              if (isNaN(costoVal) || costoVal < 0) {
                  alert('Por favor ingrese un costo válido.');
                  return;
              }

              const payload = {
                  costo: costoVal,
                  precios: {
                      lista1: lista1Val,
                      lista2: lista2Val,
                      lista3: lista3Val,
                      lista4: lista4Val,
                      lista5: lista5Val,
                      lista6: lista6Val,
                      lista7: lista7Val
                  }
              };

              try {
                  const response = await fetch(`/api/productos/${productoIdActivoPrecios}/precios`, {
                      method: 'PUT',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(payload)
                  });

                  if (!response.ok) {
                      const errData = await response.json();
                      throw new Error(errData.error || 'Error al guardar los precios.');
                  }

                  alert('Precios y costo actualizados con éxito.');
                  modalPrecios.style.display = 'none';
                  productoIdActivoPrecios = null;
                  cargarProductos(); // Recargar tabla
              } catch (error) {
                  console.error('Error al actualizar precios:', error);
                  alert('No se pudieron actualizar los precios:\n' + error.message);
              }
          });
      }
  }

  /**
   * Carga y renderiza los precios y costo correspondientes a un productId en el modal.
   * @param {number} productId ID del producto
   */
  async function cargarPreciosProducto(productId) {
      // Limpiar inputs a 0 o vacíos antes de cargar
      document.getElementById('modal-precios-costo').value = '';
      for (let i = 1; i <= 7; i++) {
          document.getElementById(`modal-precios-lista-${i}`).value = '';
      }

      try {
          // 1. Fetch de los datos del producto para obtener el costo
          const responseProd = await fetch(`/api/productos/${productId}`);
          if (!responseProd.ok) {
              throw new Error('Error al obtener los detalles del producto');
          }
          const producto = await responseProd.json();
          document.getElementById('modal-precios-costo').value = parseFloat(producto.costo || 0).toFixed(2);

          // 2. Fetch de los precios
          const responsePrecios = await fetch(`/api/prices/product/${productId}`);
          if (!responsePrecios.ok) {
              throw new Error('Error al obtener la lista de precios.');
          }

          const precios = await responsePrecios.json();
          // Como están ordenados por createdAt DESC, el primero (precios[0]) es el registro de precios activo
          if (Array.isArray(precios) && precios.length > 0) {
              const precioActivo = precios[0];
              document.getElementById('modal-precios-lista-1').value = precioActivo.precioLista1 !== null && precioActivo.precioLista1 !== undefined ? parseFloat(precioActivo.precioLista1) : 0;
              document.getElementById('modal-precios-lista-2').value = precioActivo.precioLista2 !== null && precioActivo.precioLista2 !== undefined ? parseFloat(precioActivo.precioLista2) : 0;
              document.getElementById('modal-precios-lista-3').value = precioActivo.precioLista3 !== null && precioActivo.precioLista3 !== undefined ? parseFloat(precioActivo.precioLista3) : 0;
              document.getElementById('modal-precios-lista-4').value = precioActivo.precioLista4 !== null && precioActivo.precioLista4 !== undefined ? parseFloat(precioActivo.precioLista4) : 0;
              document.getElementById('modal-precios-lista-5').value = precioActivo.precioLista5 !== null && precioActivo.precioLista5 !== undefined ? parseFloat(precioActivo.precioLista5) : 0;
              document.getElementById('modal-precios-lista-6').value = precioActivo.precioLista6 !== null && precioActivo.precioLista6 !== undefined ? parseFloat(precioActivo.precioLista6) : 0;
              document.getElementById('modal-precios-lista-7').value = precioActivo.precioLista7 !== null && precioActivo.precioLista7 !== undefined ? parseFloat(precioActivo.precioLista7) : 0;
          } else {
              // Si no tiene registros de lista, mostramos en 0 o vacío
              for (let i = 1; i <= 7; i++) {
                  document.getElementById(`modal-precios-lista-${i}`).value = 0;
              }
          }
      } catch (error) {
          console.error('Error al cargar datos del modal de precios:', error);
          alert('Error al cargar los precios del producto: ' + error.message);
      }
  }

/**
 * Calcula el total del carrito/remito actual
 */
function calcularTotalCarrito() {
    return carritoRemito.reduce((acc, item) => acc + parseFloat(item.subtotal || 0), 0);
}

/**
 * Realiza una petición GET a la API local para obtener los pedidos
 * y los renderiza en la tabla de la pestaña de pedidos.
 */
async function cargarPedidos() {
    try {
        const response = await fetch('/api/pedidos');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }

        const pedidos = await response.json();
        pedidosGlobales = pedidos;
        const tbody = document.querySelector('#tabla-pedidos tbody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!Array.isArray(pedidos) || pedidos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">No hay pedidos registrados.</td></tr>`;
            return;
        }

        pedidos.forEach(pedido => {
            const fila = document.createElement('tr');
            
            // Formatear fecha
            const fechaStr = new Date(pedido.fecha).toLocaleDateString('es-ES', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });

            const empleadoNombre = pedido.empleado ? pedido.empleado.nombreCompleto : 'Sin vendedor';
            const total = parseFloat(pedido.total || 0).toFixed(2);

            fila.innerHTML = `
                <td>${pedido.id}</td>
                <td>${empleadoNombre}</td>
                <td>${fechaStr}</td>
                <td>$${total}</td>
                <td class="col-action" style="text-align: center;">
                    <button class="btn-ver-detalle" data-id="${pedido.id}">Ver Detalle</button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
        const tbody = document.querySelector('#tabla-pedidos tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #cc0000; padding: 20px;">Error al cargar los datos de pedidos.</td></tr>`;
        }
    }
}

/**
 * Configura los manejadores de eventos para los pedidos (delegación en tabla-pedidos y modal de detalles)
 */
function configurarEventosPedidos() {
    const tablaPedidos = document.getElementById('tabla-pedidos');
    if (tablaPedidos) {
        tablaPedidos.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-ver-detalle')) {
                const id = parseInt(e.target.getAttribute('data-id'), 10);
                const pedido = pedidosGlobales.find(p => p.id === id);
                if (pedido) {
                    mostrarDetallePedido(pedido);
                } else {
                    alert('No se encontró la información del pedido.');
                }
            }
        });
    }

    const btnCerrarDetalle = document.getElementById('btn-cerrar-detalle-pedido');
    if (btnCerrarDetalle) {
        btnCerrarDetalle.addEventListener('click', () => {
            document.getElementById('modal-detalle-pedido').style.display = 'none';
        });
    }
}

/**
 * Inyecta los detalles del pedido en el modal y lo muestra
 * @param {Object} pedido Objeto del pedido con sus detalles
 */
function mostrarDetallePedido(pedido) {
    document.getElementById('detalle-pedido-id').textContent = pedido.id;
    document.getElementById('detalle-pedido-empleado').textContent = pedido.empleado ? pedido.empleado.nombreCompleto : 'Sin vendedor';
    
    const fechaStr = new Date(pedido.fecha).toLocaleDateString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
    document.getElementById('detalle-pedido-fecha').textContent = fechaStr;
    document.getElementById('detalle-pedido-total').textContent = `$${parseFloat(pedido.total || 0).toFixed(2)}`;

    const tbody = document.querySelector('#tabla-detalle-pedido tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!Array.isArray(pedido.detalles) || pedido.detalles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 15px;">Este pedido no tiene detalles de productos.</td></tr>`;
    } else {
        pedido.detalles.forEach(d => {
            const fila = document.createElement('tr');
            
            const productoNombre = d.producto ? d.producto.nombre : `Producto ID ${d.productoId}`;
            const productoMarca = d.producto ? d.producto.marca : (d.productoMarca || 'N/A');
            
            let listaName = d.listaSeleccionada || d.precioListaSeleccionado || 'N/A';
            if (listaName.startsWith('precioLista')) {
                const num = listaName.replace('precioLista', '');
                listaName = `Lista ${num}`;
            }

            fila.innerHTML = `
                <td>${productoNombre}</td>
                <td>${productoMarca}</td>
                <td>${d.cantidad}</td>
                <td>${listaName}</td>
                <td>$${parseFloat(d.precioUnitario || 0).toFixed(2)}</td>
                <td>$${parseFloat(d.subtotal || 0).toFixed(2)}</td>
            `;
            tbody.appendChild(fila);
        });
    }

    document.getElementById('modal-detalle-pedido').style.display = 'flex';
}