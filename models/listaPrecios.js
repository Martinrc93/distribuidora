const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');

class ListaPrecios extends Model {}

ListaPrecios.init({
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'El nombre es obligatorio.'
      },
      notEmpty: {
        msg: 'El nombre no puede estar vacío.'
      }
    },
    set(value) {
      if (typeof value === 'string') {
        this.setDataValue('nombre', value.trim());
      }
    }
  }
}, {
  sequelize,
  modelName: 'ListaPrecios',
  tableName: 'ListaPrecios',
  timestamps: true
});

module.exports = ListaPrecios;
