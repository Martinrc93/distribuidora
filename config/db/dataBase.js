const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false, // Desactiva logs SQL (opcional)
});

// Habilitar restricciones de clave foránea en SQLite
sequelize.authenticate().then(() => {
  sequelize.query('PRAGMA foreign_keys = ON');
});

module.exports = sequelize;
