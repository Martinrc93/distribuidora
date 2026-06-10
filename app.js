const express = require('express');
const path = require('path');
const { swaggerUi, swaggerDocs } = require('./config/swagger.js');
const productoRoutes = require('./routes/productoRoutes.js');
const empleadoRoutes = require('./routes/empleadoRoutes.js');
const pedidoRoutes = require('./routes/pedidoRoutes.js');
const priceRoutes = require('./routes/priceRoutes.js');
<<<<<<< Updated upstream
const { sequelize } = require('./models/index.js');
const cors = require('cors');
=======
const ventaRoutes = require('./routes/ventaRoutes.js');
const clienteRoutes = require('./routes/clienteRoutes.js');
const sequelize = require('./config/db/dataBase.js');
const Product = require('./models/product.js');
const Empleado = require('./models/empleado.js');
const Price = require('./models/price.js');
const Venta = require('./models/venta.js');
const Detalle = require('./models/detalle.js');
const Cliente = require('./models/cliente.js');
const ListaPrecios = require('./models/listaPrecios.js');





>>>>>>> Stashed changes

const app = express();
const port = 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

<<<<<<< Updated upstream
// Servimos la carpeta principal (raíz) ya que ahí están guardados el index.html, style.css y main.js
app.use(express.static(__dirname));
=======
// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));
>>>>>>> Stashed changes

// Servir la documentación de Swagger en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

<<<<<<< Updated upstream
app.use('/api/productos', productoRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/prices', priceRoutes);
=======
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/empleados', empleadoRoutes);
app.use('/prices', priceRoutes);
app.use('/ventas', ventaRoutes);
app.use('/clientes', clienteRoutes);

// Servir index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});
>>>>>>> Stashed changes

// Sincronizar base de datos e iniciar servidor
sequelize.sync({ force: false })
  .then(() => {
    console.log('Conexión a SQLite establecida y modelos sincronizados.');
    console.log(`Documentación de Swagger disponible en http://localhost:${port}/api-docs`);
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar o sincronizar la base de datos:', err);
  });
