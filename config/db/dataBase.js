// Configurar zona horaria local para Sequelize
require('../timezone.js');
const { Sequelize } = require('sequelize');

const storagePath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : (process.env.DB_PATH || './database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false, // Desactiva logs SQL (opcional)
});

// Habilitar restricciones de clave foránea, modo WAL y busy_timeout en SQLite
sequelize.authenticate().then(async () => {
  await sequelize.query('PRAGMA foreign_keys = ON;');
  await sequelize.query('PRAGMA journal_mode = WAL;');
  await sequelize.query('PRAGMA busy_timeout = 5000;');
});

module.exports = sequelize;
