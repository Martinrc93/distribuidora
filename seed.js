const fs = require('fs');
const path = require('path');
const sequelize = require('./config/db/dataBase.js');
const User = require('./models/user.js'); // Importar el modelo para registrarlo en Sequelize

async function ejecutarSembrado() {
  try {
    // Sincronizar la base de datos primero para asegurar que las tablas existan
    await sequelize.sync({ force: false });

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
