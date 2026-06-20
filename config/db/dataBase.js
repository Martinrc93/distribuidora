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
  retry: {
    max: 10,
    match: [/SQLITE_BUSY/],
  }
});

// Habilitar restricciones de clave foránea, modo WAL y busy_timeout en SQLite inmediatamente (en la cola de consultas)
sequelize.query('PRAGMA foreign_keys = ON;');
sequelize.query('PRAGMA journal_mode = WAL;');
sequelize.query('PRAGMA busy_timeout = 5000;');

module.exports = sequelize;

