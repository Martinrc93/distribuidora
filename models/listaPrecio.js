const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');

class ListaPrecio extends Model {}

ListaPrecio.init({
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El nombre es obligatorio.'
            },
            notEmpty: {
                msg: 'El nombre no puede estar vacío.'
            }
        }
    }
}, {
    sequelize,
    modelName: 'ListaPrecio',
    tableName: 'ListaPrecios',
    timestamps: true
});

module.exports = ListaPrecio;
