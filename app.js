// Alinear base de datos, aplicación y sistema en la misma zona horaria local
require('./config/timezone.js');


const express = require('express');
const path = require('path');
const cors = require('cors');
const empleadoRoutes = require('./routes/empleadoRoutes.js');
const priceRoutes = require('./routes/priceRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const ventaRoutes = require('./routes/ventaRoutes.js');
const clienteRoutes = require('./routes/clienteRoutes.js');
const marcaRoutes = require('./routes/marcaRoutes.js');
const whatsappRoutes = require('./routes/whatsappRoutes.js');
const dashboardRoutes = require('./routes/dashboardRoutes.js');
const { initWhatsApp } = require('./services/whatsappService.js');
const sequelize = require('./config/db/dataBase.js');
const Product = require('./models/product.js');
const Empleado = require('./models/empleado.js');
const Price = require('./models/price.js');
const Venta = require('./models/venta.js');
const Detalle = require('./models/detalle.js');
const Cliente = require('./models/cliente.js');
const ListaPrecios = require('./models/listaPrecios.js');
const Marca = require('./models/marca.js');
const Configuracion = require('./models/configuracion.js');

const app = express();
app.disable('x-powered-by');
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Servir la documentación de Swagger en /api-docs únicamente en desarrollo/test
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV) {
  try {
    const { swaggerUi, swaggerDocs } = require('./config/swagger.js');
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  } catch (err) {
    console.warn('No se pudo inicializar Swagger:', err.message);
  }
}

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/empleados', empleadoRoutes);
app.use('/prices', priceRoutes);
app.use('/ventas', ventaRoutes);
app.use('/clientes', clienteRoutes);
app.use('/marcas', marcaRoutes);
app.use('/whatsapp', whatsappRoutes);
app.use('/dashboard', dashboardRoutes);

// Endpoint para obtener la configuración del negocio
app.get('/api/config', async (req, res, next) => {
  try {
    const configs = await Configuracion.findAll();
    const configMap = {};
    configs.forEach(c => {
      configMap[c.clave] = c.valor;
    });
    res.json(configMap);
  } catch (err) {
    next(err);
  }
});

// Endpoint para obtener las listas de precios
app.get('/api/lista-precios', async (req, res, next) => {
  try {
    const listas = await ListaPrecios.findAll({ order: [['id', 'ASC']] });
    res.json(listas);
  } catch (err) {
    next(err);
  }
});

// Servir index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Middleware global de manejo de errores
app.use(require('./middleware/errorHandler.js'));

// Sincronizar base de datos e iniciar servidor
let resolveServerReady;
const serverReady = new Promise((resolve) => {
  resolveServerReady = resolve;
});
app.serverReady = serverReady;

if (process.env.NODE_ENV !== 'test') {
  const migrateDatabase = async () => {
    const tables = ['Clientes', 'Empleados', 'Products', 'Ventas', 'Detalles', 'Prices', 'Marcas', 'Users', 'Configuraciones'];
    for (const table of tables) {
      try {
        const [columns] = await sequelize.query(`PRAGMA table_info(\`${table}\`);`);
        if (columns.length > 0) {
          const hasDeletedAt = columns.some(col => col.name === 'deletedAt');
          if (!hasDeletedAt) {
            console.log(`Migración: Agregando columna deletedAt a la tabla ${table}`);
            await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN deletedAt DATETIME;`);
          }
        }
      } catch (err) {
        console.error(`Error al verificar/migrar la tabla ${table}:`, err);
      }
    }
  };

  // Inicializar pragmas de forma segura antes de migrar
  sequelize.initPragmas()
    .then(() => migrateDatabase())
    .then(() => sequelize.sync({ force: false }))
    .then(() => {
      console.log('Conexión a SQLite establecida y modelos sincronizados.');
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV) {
        console.log(`Documentación de Swagger disponible en http://localhost:${port}/api-docs`);
      }
      
      // Inicializar cliente de WhatsApp
      initWhatsApp();

      app.listen(port, '127.0.0.1', () => {
        console.log(`Servidor corriendo en http://127.0.0.1:${port}`);
        resolveServerReady();
      });
    })
    .catch(err => {
      console.error('Error al conectar o sincronizar la base de datos:', err);
      resolveServerReady(); // Resolver para no colgar Electron si hay error
    });
} else {
  // En test resolver inmediatamente
  resolveServerReady();
}

module.exports = app;
