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
  },

  hooks: {
    afterConnect: (connection, config) => {
      return new Promise((resolve, reject) => {
        connection.serialize(() => {
          connection.run('PRAGMA foreign_keys = ON;', (err) => { if (err) return reject(err); });
          connection.run('PRAGMA journal_mode = WAL;', (err) => { if (err) return reject(err); });
          connection.run('PRAGMA busy_timeout = 5000;', (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    }
  }
});

// Mantener función initPragmas vacía por compatibilidad con app.js
async function initPragmas() {
  // Las PRAGMAs ya se aplican automáticamente en cada conexión a través del hook afterConnect
}

module.exports = sequelize;
module.exports.initPragmas = initPragmas;

