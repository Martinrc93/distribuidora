// Alinear base de datos, aplicación y sistema en la misma zona horaria local
try {
    const modulePath = require.resolve('sequelize/lib/dialects/sqlite/data-types');
    const originalCreator = require(modulePath);
    require.cache[modulePath].exports = function(BaseTypes) {
        const types = originalCreator(BaseTypes);
        const originalParse = types.DATE.parse;
        types.DATE.parse = function(date, options) {
            if (typeof date === 'string') {
                const cleanVal = date.replace(/'/g, '').replace(/\s*[+-]\d+:\d+$/, '').replace('Z', '').trim();
                const parts = cleanVal.split(' ');
                const dateStr = parts[0] + (parts[1] ? 'T' + parts[1] : '');
                return new Date(dateStr);
            }
            return originalParse.call(this, date, options);
        };
        return types;
    };
    
    const { DataTypes } = require('sequelize');
    const DateType = DataTypes.DATE;
    DateType.prototype.stringify = function(date, options) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
    };
} catch (e) {
    console.error('Error al configurar la alineación de zona horaria local:', e);
}

const express = require('express');
const path = require('path');
const cors = require('cors');
const { swaggerUi, swaggerDocs } = require('./config/swagger.js');
const empleadoRoutes = require('./routes/empleadoRoutes.js');
const priceRoutes = require('./routes/priceRoutes.js');
const userRoutes = require('./routes/userRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const ventaRoutes = require('./routes/ventaRoutes.js');
const clienteRoutes = require('./routes/clienteRoutes.js');
const marcaRoutes = require('./routes/marcaRoutes.js');
const whatsappRoutes = require('./routes/whatsappRoutes.js');
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

const app = express();
app.disable('x-powered-by');
const port = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Servir la documentación de Swagger en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/empleados', empleadoRoutes);
app.use('/prices', priceRoutes);
app.use('/ventas', ventaRoutes);
app.use('/clientes', clienteRoutes);
app.use('/marcas', marcaRoutes);
app.use('/whatsapp', whatsappRoutes);

// Servir index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Sincronizar base de datos e iniciar servidor
sequelize.sync({ force: false })
  .then(() => {
    console.log('Conexión a SQLite establecida y modelos sincronizados.');
    console.log(`Documentación de Swagger disponible en http://localhost:${port}/api-docs`);
    
    // Inicializar cliente de WhatsApp
    initWhatsApp();

    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar o sincronizar la base de datos:', err);
  });
