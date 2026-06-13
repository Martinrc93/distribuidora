const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

// Let's inspect where parser is defined
const sqliteDialect = sequelize.connectionManager.dialect;
console.log('Dialect DataTypes.DATE parse exists:', typeof sqliteDialect.DataTypes.DATE.parse);
console.log('DataTypes.DATE.types.sqlite:', sqliteDialect.DataTypes.DATE.types?.sqlite);
console.log('DataTypes.DATE.prototype.parse:', typeof DataTypes.DATE.prototype.parse);

// Let's look at the connection manager parser registration
const sqlite3 = require('sqlite3');
// Actually, Sequelize registers sqlite data type parsers.
// Let's see if we can find the parser in the sqlite dialect.
// Usually, it's defined in sqliteDialect.DataTypes.DATE.parse or similar.
