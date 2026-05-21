const { DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');

const User = sequelize.define('User', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      this.setDataValue('nombre', value ? value.trim() : null);
    }
  }
}, {
  timestamps: true
});

module.exports = User;