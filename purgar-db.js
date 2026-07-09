// Alinear base de datos, aplicación y sistema en la misma zona horaria local
require('./config/timezone.js');

const { Op } = require('sequelize');
const sequelize = require('./config/db/dataBase.js');

const Detalle = require('./models/detalle.js');
const Venta = require('./models/venta.js');
const Price = require('./models/price.js');
const Product = require('./models/product.js');
const Cliente = require('./models/cliente.js');
const Empleado = require('./models/empleado.js');
const Marca = require('./models/marca.js');
const Configuracion = require('./models/configuracion.js');

const models = [
  { name: 'Detalle', model: Detalle },
  { name: 'Venta', model: Venta },
  { name: 'Price', model: Price },
  { name: 'Product', model: Product },
  { name: 'Cliente', model: Cliente },
  { name: 'Empleado', model: Empleado },
  { name: 'Marca', model: Marca },
  { name: 'Configuracion', model: Configuracion }
];

async function purgarManual() {
  try {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 60);
    console.log(`Iniciando purga manual de registros obsoletos (deletedAt anterior a 60 días: ${limitDate.toISOString()})...`);

    for (const { name, model } of models) {
      const count = await model.destroy({
        where: {
          deletedAt: {
            [Op.lt]: limitDate
          }
        },
        force: true,
        paranoid: false
      });
      console.log(`Modelo ${name}: se purgaron ${count} registros.`);
    }

    console.log('Purga manual completada con éxito.');
  } catch (error) {
    console.error('Error durante la purga manual:', error);
  } finally {
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error al cerrar la conexión a la base de datos:', closeError);
    }
    process.exit(0);
  }
}

purgarManual();
