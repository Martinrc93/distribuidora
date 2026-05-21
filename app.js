const express = require('express');
const userRoutes = require('./routes/userRoutes.js');
const sequelize = require('./config/db/dataBase.js');

const app = express();
const port = 3000;

app.use(express.json());
app.use('/users', userRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola! El servidor de la distribuidora está funcionando.');
});

// Sincronizar base de datos e iniciar servidor
sequelize.sync({ force: false })
  .then(() => {
    console.log('Conexión a SQLite establecida y modelos sincronizados.');
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error al conectar o sincronizar la base de datos:', err);
  });
