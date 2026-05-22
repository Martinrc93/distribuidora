const express = require('express');
const { swaggerUi, swaggerDocs } = require('./config/swagger.js');
const userRoutes = require('./routes/userRoutes.js');
const sequelize = require('./config/db/dataBase.js');

const app = express();
const port = 3000;

app.use(express.json());

// Servir la documentación de Swagger en /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/users', userRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola! El servidor de la distribuidora está funcionando. La documentación está en <a href="/api-docs">/api-docs</a>.');
});

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
