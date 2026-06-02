const { DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase.js');

const Pedido = sequelize.define('Pedido', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'fecha_emision'
    },
    clienteDestino: {
        type: DataTypes.STRING,
        allowNull: true
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El total del pedido no puede ser negativo.'
            }
        }
    },
    ganancia: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pendiente'
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'pedidos',
    timestamps: true
});

module.exports = Pedido;