// Alinear base de datos, aplicación y sistema en la misma zona horaria local
require('./config/timezone.js');
const sequelize = require('./config/db/dataBase.js');
const { verificarYCrearListasPrecios } = require('./services/initListaPrecios.js');

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    await verificarYCrearListasPrecios();
  } catch (error) {
    console.error('Error al ejecutar el script de inicialización de listas:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
