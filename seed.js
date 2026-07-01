// Alinear base de datos, aplicación y sistema en la misma zona horaria local
require('./config/timezone.js');

const sequelize = require('./config/db/dataBase.js');
const User = require('./models/user.js');
const Product = require('./models/product.js');
const Empleado = require('./models/empleado.js');
const Price = require('./models/price.js');
const Venta = require('./models/venta.js');
const Detalle = require('./models/detalle.js');
const Cliente = require('./models/cliente.js');
const ListaPrecios = require('./models/listaPrecios.js');
const Marca = require('./models/marca.js');
const Configuracion = require('./models/configuracion.js');

async function ejecutarSembrado() {
  try {
    console.log('Iniciando sembrado de base de datos...');

    // Desactivar llaves foráneas y eliminar tablas antiguas
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.query('DROP TABLE IF EXISTS `Detalles`;');
    await sequelize.query('DROP TABLE IF EXISTS `Venta`;');
    await sequelize.query('DROP TABLE IF EXISTS `Ventas`;');
    await sequelize.query('DROP TABLE IF EXISTS `Clientes`;');
    await sequelize.query('DROP TABLE IF EXISTS `Prices`;');
    await sequelize.query('DROP TABLE IF EXISTS `Empleados`;');
    await sequelize.query('DROP TABLE IF EXISTS `Products`;');
    await sequelize.query('DROP TABLE IF EXISTS `Marcas`;');
    await sequelize.query('DROP TABLE IF EXISTS `Users`;');
    await sequelize.query('DROP TABLE IF EXISTS `ListaPrecios`;');
    await sequelize.query('DROP TABLE IF EXISTS `Configuraciones`;');
    await sequelize.query('PRAGMA foreign_keys = ON;');

    // Sincronizar las tablas vacías
    await sequelize.sync({ force: true });
    console.log('Tablas recreadas con éxito.');

    // 1. Crear 5 Usuarios por defecto para compatibilidad del sistema
    await User.bulkCreate([
      { nombre: 'Juan Pérez' },
      { nombre: 'María Rodríguez' },
      { nombre: 'Carlos Gómez' },
      { nombre: 'Ana Martínez' },
      { nombre: 'Lucía Fernández' }
    ]);
    console.log('Usuarios creados.');

    // 2. Crear Configuraciones básicas
    await Configuracion.bulkCreate([
      { clave: 'nombre_negocio', valor: 'Distri-Pipipuch' },
      { clave: 'info_contacto', valor: 'LORENA 1150222520 - DANIEL 1150222413' }
    ]);
    console.log('Configuraciones creadas.');

    // 3. Crear las 8 listas de precios requeridas por el sistema
    const listasData = [];
    for (let i = 1; i <= 8; i++) {
      listasData.push({ id: i, nombre: `Lista ${i}` });
    }
    const listasPrecios = await ListaPrecios.bulkCreate(listasData);
    console.log('8 listas de precios base creadas (Lista 1 a Lista 8).');

    // 4. Crear exactamente 10 Marcas
    const nombresMarcas = [
      'Marlboro', 'Lucky Strike', 'Philip Morris', 'Chesterfield', 'Camel',
      'Red Point', 'Milenio / Mill', 'Melbourne', 'Kiel', 'Master'
    ];
    const marcasData = nombresMarcas.map(nombre => ({ nombre }));
    const marcas = await Marca.bulkCreate(marcasData);
    console.log('10 marcas creadas.');

    // 5. Para cada marca, crear entre 5 y 10 productos
    const productosCreados = [];
    const preciosData = [];

    for (let i = 0; i < marcas.length; i++) {
      const marca = marcas[i];
      const cantProductos = Math.floor(Math.random() * 6) + 5; // 5 a 10 productos

      for (let j = 1; j <= cantProductos; j++) {
        const costo = parseFloat((Math.random() * 400 + 100).toFixed(2));

        const producto = await Product.create({
          nombre: `${marca.nombre.toUpperCase()} - Producto ${j}`,
          marcaId: marca.id,
          costo: costo
        });

        productosCreados.push(producto);

        // Cada producto tiene precios en entre 1 y 5 listas de precios elegidas al azar
        const cantPrecios = Math.floor(Math.random() * 5) + 1; // 1 a 5 listas
        const listasElegidas = [...listasPrecios]
          .sort(() => 0.5 - Math.random())
          .slice(0, cantPrecios);

        for (const lista of listasElegidas) {
          const margen = 1.1 + (Math.random() * 0.4); // Margen entre 10% y 50%
          const precioVenta = parseFloat((costo * margen).toFixed(2));

          preciosData.push({
            precio: precioVenta,
            productoId: producto.id,
            listaPreciosId: lista.id
          });
        }
      }
    }

    // Insertar precios en lote
    const precios = await Price.bulkCreate(preciosData);
    console.log(`Productos creados. Cada uno con precio en un subconjunto aleatorio de 1 a 5 listas.`);

    // Organizar precios en un mapa para búsqueda rápida
    const mapaPrecios = {};
    precios.forEach(p => {
      if (!mapaPrecios[p.productoId]) {
        mapaPrecios[p.productoId] = {};
      }
      mapaPrecios[p.productoId][p.listaPreciosId] = p;
    });

    // 6. Crear 10 clientes (cada uno con una lista de precios asignada al azar)
    const clientesData = [];
    for (let i = 1; i <= 10; i++) {
      const listaAleatoria = listasPrecios[Math.floor(Math.random() * listasPrecios.length)];
      clientesData.push({
        id: i,
        nombre: `Cliente Especial ${i}`,
        direccion: `Calle Falsa ${100 * i}`,
        contacto: `11-${1000 + i}-${2000 + i}`,
        listaPreciosId: listaAleatoria.id
      });
    }
    const clientes = await Cliente.bulkCreate(clientesData);
    console.log('10 clientes creados.');

    // 7. Crear 3 empleados
    const empleadosData = [
      { id: 1, nombre: 'Martín', apellido: 'Gómez', activo: true },
      { id: 2, nombre: 'Florencia', apellido: 'Díaz', activo: true },
      { id: 3, nombre: 'Roberto', apellido: 'Sánchez', activo: true }
    ];
    const empleados = await Empleado.bulkCreate(empleadosData);
    console.log('3 empleados creados.');

    // 8. Crear 20 pedidos (Ventas y Detalles) con la fecha y hora actual de ejecución
    const ahora = new Date();
    console.log(`Generando 20 pedidos con fecha de emisión: ${ahora.toISOString()}...`);

    for (let i = 1; i <= 20; i++) {
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      const empleado = empleados[Math.floor(Math.random() * empleados.length)];

      const venta = await Venta.create({
        id: i,
        empleadoId: empleado.id,
        clienteId: cliente.id,
        fechaEmision: ahora,
        total: 0,
        ganancia: 0,
        activo: true
      });

      // Elegir entre 1 y 4 productos aleatorios distintos para este pedido
      const cantItems = Math.floor(Math.random() * 4) + 1;
      const productosElegidos = [];
      while (productosElegidos.length < cantItems) {
        const prod = productosCreados[Math.floor(Math.random() * productosCreados.length)];
        if (!productosElegidos.some(p => p.id === prod.id)) {
          productosElegidos.push(prod);
        }
      }

      let totalVenta = 0;
      let totalGanancia = 0;

      for (const prod of productosElegidos) {
        const listaId = cliente.listaPreciosId;
        let priceRecord = mapaPrecios[prod.id][listaId];

        // Fallback si no tiene precio asignado para la lista del cliente (toma cualquier lista disponible)
        if (!priceRecord) {
          const listasDisponibles = Object.keys(mapaPrecios[prod.id]);
          if (listasDisponibles.length > 0) {
            priceRecord = mapaPrecios[prod.id][listasDisponibles[0]];
          }
        }

        if (!priceRecord) continue;

        const cantidad = Math.floor(Math.random() * 5) + 1; // Entre 1 y 5 unidades
        const unitPrice = parseFloat(priceRecord.precio);
        const costo = parseFloat(prod.costo) || 0;
        const gananciaUnidad = Math.max(0, unitPrice - costo);

        const subtotal = cantidad * unitPrice;
        const gananciaSubtotal = cantidad * gananciaUnidad;

        totalVenta += subtotal;
        totalGanancia += gananciaSubtotal;

        await Detalle.create({
          ventaId: venta.id,
          productoId: prod.id,
          precioId: priceRecord.id,
          cantidad: cantidad,
          precio: unitPrice
        });
      }

      // Actualizar totales y ganancias de la venta
      await venta.update({
        total: parseFloat(totalVenta.toFixed(2)),
        ganancia: parseFloat(totalGanancia.toFixed(2))
      });
    }

    console.log('🌱 ¡20 pedidos creados exitosamente!');
    console.log('🌱 ¡Sembrado completado con éxito!');
  } catch (error) {
    console.error('❌ Error al ejecutar el sembrado:', error);
  } finally {
    await sequelize.close();
  }
}

ejecutarSembrado();
