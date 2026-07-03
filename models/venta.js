const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');
const Empleado = require('./empleado.js');
const Cliente = require('./cliente.js');

// 1. Definición del modelo Venta
class Venta extends Model {
}

// 2. Inicialización del modelo
Venta.init({
    fechaEmision: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, // Por defecto la fecha y hora actuales
        field: 'fecha_emision'       // Nombre de columna física en la base de datos
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El total de la venta es obligatorio.'
            },
            min: {
                args: [0],
                msg: 'El total de la venta no puede ser negativo.'
            }
        }
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'activo'
    },
    ordenImpresion: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'orden_impresion'
    },
    empleadoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Empleados', // Tabla física de Empleados
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de empleado es obligatorio.'
            }
        }
    },
    clienteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Clientes', // Tabla física de Clientes
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de cliente es obligatorio.'
            }
        }
    },
    ganancia: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            notNull: {
                msg: 'La ganancia es obligatoria.'
            }
        }
    }
}, {
    sequelize,         // Instancia de conexión
    modelName: 'Venta', // Nombre del modelo
    tableName: 'Ventas', // Nombre de la tabla física en la base de datos
    timestamps: true,   // Mantiene createdAt y updatedAt
    paranoid: true,
    indexes: [
        { fields: ['empleadoId'] },
        { fields: ['clienteId'] },
        { fields: ['activo'] },
        { fields: ['fecha_emision'] }
    ]
});

// 3. Relaciones (Asociaciones)
Venta.belongsTo(Empleado, { foreignKey: 'empleadoId', as: 'empleado' });
Empleado.hasMany(Venta, { foreignKey: 'empleadoId', as: 'ventas' });

Venta.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
Cliente.hasMany(Venta, { foreignKey: 'clienteId', as: 'ventas' });

module.exports = Venta;
