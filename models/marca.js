const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');

class Marca extends Model {}

Marca.init({
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notNull: {
                msg: 'El nombre de la marca es obligatorio.'
            },
            notEmpty: {
                msg: 'El nombre de la marca no puede estar vacío.'
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
    modelName: 'Marca',
    tableName: 'Marcas',
    timestamps: true
});

module.exports = Marca;
