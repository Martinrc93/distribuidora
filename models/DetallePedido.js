const { DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase.js');

const DetallePedido = sequelize.define('DetallePedido', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    precioListaSeleccionado: {
        type: DataTypes.STRING,
        allowNull: false
    },
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    priceId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'detalle_pedidos',
    timestamps: true
});

module.exports = DetallePedido;