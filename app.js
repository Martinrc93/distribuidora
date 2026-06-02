const express = require('express');
const path = require('path');
const { swaggerUi, swaggerDocs } = require('./config/swagger.js');
const productoRoutes = require('./routes/productoRoutes.js');
const empleadoRoutes = require('./routes/empleadoRoutes.js');
const pedidoRoutes = require('./routes/pedidoRoutes.js');
const priceRoutes = require('./routes/priceRoutes.js');
const { sequelize } = require('./models/index.js');
const cors = require('cors');

const app = express();
const port = 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Servimos la carpeta principal (raíz) ya que ahí están guardados el index.html, style.css y main.js
app.use(express.static(__dirname));

// Servir la documentación de Swagger en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/productos', productoRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/prices', priceRoutes);

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
