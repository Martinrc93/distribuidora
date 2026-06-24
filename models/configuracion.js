const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');

class Configuracion extends Model {}

Configuracion.init({
    clave: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        validate: {
            notNull: {
                msg: 'La clave es obligatoria.'
            },
            notEmpty: {
                msg: 'La clave no puede estar vacía.'
            }
        }
    },
    valor: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El valor es obligatorio.'
            }
        }
    }
}, {
    sequelize,
    modelName: 'Configuracion',
    tableName: 'Configuraciones',
    timestamps: true,
    paranoid: true
});

module.exports = Configuracion;
