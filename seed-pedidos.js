// Alinear base de datos, aplicación y sistema en la misma zona horaria local
require('./config/timezone.js');

const sequelize = require('./config/db/dataBase.js');
const Venta = require('./models/venta.js');
const Detalle = require('./models/detalle.js');
const Cliente = require('./models/cliente.js');
const Empleado = require('./models/empleado.js');
const Product = require('./models/product.js');
const Price = require('./models/price.js');

async function sembrarPedidos() {
  try {
    console.log('Iniciando sembrado de pedidos de prueba...');

    // 1. Verificar que existan Clientes, Empleados y Productos en la DB
    const clientes = await Cliente.findAll();
    const empleados = await Empleado.findAll();
    const productos = await Product.findAll();

    if (clientes.length === 0 || empleados.length === 0 || productos.length === 0) {
      console.error('Error: Asegurate de correr primero "node seed.js" para cargar los datos base (clientes, empleados, productos, precios).');
      return;
    }

    console.log(`Encontrados: ${clientes.length} clientes, ${empleados.length} empleados, ${productos.length} productos.`);

    // 2. Obtener los precios cargados en la base de datos
    const precios = await Price.findAll();
    if (precios.length === 0) {
      console.error('Error: No se encontraron registros de precios en la base de datos.');
      return;
    }

    // Organizar precios por producto y lista de precios para búsqueda rápida
    const mapaPrecios = {}; // { productId: { listaPreciosId: PriceRecord } }
    precios.forEach(p => {
      if (!mapaPrecios[p.productId]) {
        mapaPrecios[p.productId] = {};
      }
      mapaPrecios[p.productId][p.listaPreciosId] = p;
    });

    // Iniciar transacción inmediata
    const t = await sequelize.transaction({ type: 'IMMEDIATE' });

    try {
      const cantidadPedidos = 50; // Cantidad de pedidos a generar
      console.log(`Generando ${cantidadPedidos} pedidos distribuidos en los últimos 30 días...`);

      const ahora = new Date();

      for (let i = 0; i < cantidadPedidos; i++) {
        // Elegir cliente y empleado aleatorio
        const cliente = clientes[Math.floor(Math.random() * clientes.length)];
        const empleado = empleados[Math.floor(Math.random() * empleados.length)];

        // Generar una fecha aleatoria en los últimos 30 días
        const diasAtras = Math.floor(Math.random() * 30);
        const horasAtras = Math.floor(Math.random() * 24);
        const minutosAtras = Math.floor(Math.random() * 60);
        const fechaEmision = new Date(ahora.getTime() - (diasAtras * 24 * 60 * 60 * 1000 + horasAtras * 60 * 60 * 1000 + minutosAtras * 60 * 1000));

        // Crear la cabecera de la venta
        const venta = await Venta.create({
          empleadoId: empleado.id,
          clienteId: cliente.id,
          fechaEmision: fechaEmision,
          total: 0,
          ganancia: 0,
          active: true
        }, { transaction: t });

        // Elegir entre 1 y 4 productos aleatorios distintos para este pedido
        const cantidadItems = Math.floor(Math.random() * 4) + 1;
        const productosElegidos = [];
        while (productosElegidos.length < cantidadItems) {
          const prod = productos[Math.floor(Math.random() * productos.length)];
          if (!productosElegidos.some(p => p.id === prod.id)) {
            productosElegidos.push(prod);
          }
        }

        let totalVenta = 0;
        let totalGanancia = 0;

        for (const prod of productosElegidos) {
          // Intentar obtener el precio correspondiente a la lista del cliente
          const listaId = cliente.listaPreciosId || 1;
          let priceRecord = null;

          if (mapaPrecios[prod.id]) {
            priceRecord = mapaPrecios[prod.id][listaId];
            // Fallback si el producto no tiene precio asignado en la lista del cliente
            if (!priceRecord) {
              const listasDisponibles = Object.keys(mapaPrecios[prod.id]);
              if (listasDisponibles.length > 0) {
                priceRecord = mapaPrecios[prod.id][listasDisponibles[0]];
              }
            }
          }

          // Si no tiene precio en absoluto, ignoramos el producto
          if (!priceRecord) continue;

          const cantidad = Math.floor(Math.random() * 5) + 1; // Entre 1 y 5 unidades
          const unitPrice = parseFloat(priceRecord.precio);
          const costo = parseFloat(prod.costo) || 0;
          const gananciaUnidad = Math.max(0, unitPrice - costo);

          const subtotal = cantidad * unitPrice;
          const gananciaSubtotal = cantidad * gananciaUnidad;

          totalVenta += subtotal;
          totalGanancia += gananciaSubtotal;

          // Crear el detalle
          await Detalle.create({
            sellId: venta.id,
            productId: prod.id,
            priceId: priceRecord.id,
            cantidad: cantidad,
            precio: unitPrice
          }, { transaction: t });
        }

        // Actualizar totales de la venta
        await venta.update({
          total: parseFloat(totalVenta.toFixed(2)),
          ganancia: parseFloat(totalGanancia.toFixed(2))
        }, { transaction: t });
      }

      await t.commit();
      console.log(`\n🌱 ¡Se sembraron con éxito ${cantidadPedidos} pedidos de prueba!`);
    } catch (innerError) {
      await t.rollback();
      throw innerError;
    }

  } catch (error) {
    console.error('❌ Error al sembrar pedidos:', error);
  } finally {
    await sequelize.close();
  }
}

sembrarPedidos();
