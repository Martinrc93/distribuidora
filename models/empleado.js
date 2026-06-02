const { DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase.js');

const Empleado = sequelize.define('Empleado', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreCompleto: {
        type: DataTypes.STRING,
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'empleados',
    timestamps: true
});

module.exports = Empleado;