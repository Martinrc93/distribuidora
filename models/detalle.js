const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');
const Venta = require('./venta.js');
const Product = require('./product.js');
const Price = require('./price.js');

// 1. Definición del modelo Detalle (Detalle de Venta)
class Detalle extends Model {
}

// 2. Inicialización del modelo
Detalle.init({
    ventaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Ventas',
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de venta (ventaId) es obligatorio.'
            }
        }
    },
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Products',
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de producto es obligatorio.'
            }
        }
    },
    precioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Prices',
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de precio (precioId) es obligatorio.'
            }
        }
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'La cantidad es obligatoria.'
            },
            min: {
                args: [1],
                msg: 'La cantidad debe ser al menos 1.'
            }
        }
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El precio unitario es obligatorio.'
            },
            min: {
                args: [0],
                msg: 'El precio no puede ser negativo.'
            }
        }
    }
}, {
    sequelize,
    modelName: 'Detalle',
    tableName: 'Detalles', // Forzamos el nombre de la tabla a "Detalles" en plural
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['ventaId'] },
        { fields: ['productoId'] },
        { fields: ['precioId'] }
    ]
});

// 3. Relaciones (Asociaciones)
Detalle.belongsTo(Venta, { foreignKey: 'ventaId', as: 'venta' });
Venta.hasMany(Detalle, { foreignKey: 'ventaId', as: 'detalles' });

Detalle.belongsTo(Product, { foreignKey: 'productoId', as: 'producto' });
Product.hasMany(Detalle, { 
    foreignKey: 'productoId', 
    as: 'detalles',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Detalle.belongsTo(Price, { foreignKey: 'precioId', as: 'precioHistorico' });
Price.hasMany(Detalle, { foreignKey: 'precioId', as: 'detalles' });

module.exports = Detalle;
