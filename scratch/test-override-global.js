const { Sequelize, DataTypes } = require('sequelize');

console.log('Global DataTypes.DATE.parse exists:', typeof DataTypes.DATE.parse);
console.log('Global DataTypes.DATE.prototype.parse exists:', typeof DataTypes.DATE.prototype.parse);

// Let's print all properties on DataTypes.DATE and its prototype
console.log('DataTypes.DATE keys:', Object.keys(DataTypes.DATE));
console.log('DataTypes.DATE.prototype keys:', Object.keys(DataTypes.DATE.prototype));
