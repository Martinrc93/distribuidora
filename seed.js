const fs = require('node:fs');
const path = require('node:path');
const sequelize = require('./config/db/dataBase.js');
const User = require('./models/user.js'); // Importar el modelo para registrarlo en Sequelize
const Product = require('./models/product.js'); // Importar el modelo de Producto
const Empleado = require('./models/empleado.js'); // Importar el modelo de Empleado
const Price = require('./models/price.js'); // Importar el modelo de Price
const Venta = require('./models/venta.js'); // Importar el modelo de Venta
const Detalle = require('./models/detalle.js'); // Importar el modelo de Detalle
const Cliente = require('./models/cliente.js'); // Importar el modelo de Cliente
const ListaPrecios = require('./models/listaPrecios.js'); // Importar el modelo de ListaPrecios

async function ejecutarSembrado() {
  try {
    // Desactivar llaves foráneas y eliminar tablas antiguas (incluyendo la huérfana 'Venta' singular) para evitar conflictos de restricciones
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.query('DROP TABLE IF EXISTS `Detalles`;');
    await sequelize.query('DROP TABLE IF EXISTS `Venta`;');
    await sequelize.query('DROP TABLE IF EXISTS `Ventas`;');
    await sequelize.query('DROP TABLE IF EXISTS `Clientes`;');
    await sequelize.query('DROP TABLE IF EXISTS `Prices`;');
    await sequelize.query('DROP TABLE IF EXISTS `Empleados`;');
    await sequelize.query('DROP TABLE IF EXISTS `Products`;');
    await sequelize.query('DROP TABLE IF EXISTS `Users`;');
    await sequelize.query('DROP TABLE IF EXISTS `ListaPrecios`;');
    await sequelize.query('PRAGMA foreign_keys = ON;');

    // Sincronizar la base de datos recreando las tablas (force: true) para aplicar cambios de esquema automáticamente
    await sequelize.sync({ force: true });

    // Leer el archivo seed.sql
    const rutaSql = path.join(__dirname, 'seed.sql');
    let sql = fs.readFileSync(rutaSql, 'utf8');

    // Limpiar comentarios de SQL (líneas que empiezan con --) y espacios vacíos
    sql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    if (!sql) {
      console.log('El archivo seed.sql está vacío o solo contiene comentarios.');
      return;
    }

    console.log('Ejecutando consultas de seed.sql...');
    
    // Dividir por punto y coma para ejecutar cada sentencia por separado
    const sentencias = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const sentencia of sentencias) {
      await sequelize.query(sentencia);
    }
    
    console.log('🌱 ¡Base de datos poblada con éxito desde seed.sql!');
  } catch (error) {
    console.error('❌ Error al ejecutar el archivo de semillas:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
}

ejecutarSembrado();
