const { Sequelize } = require('sequelize');

const storagePath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : (process.env.DB_PATH || './database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false, // Desactiva logs SQL (opcional)
});

// Habilitar restricciones de clave foránea en SQLite
sequelize.authenticate().then(() => {
  sequelize.query('PRAGMA foreign_keys = ON');
});

module.exports = sequelize;
