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
    sellId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Ventas', // Tabla física de Ventas
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de venta (sellId) es obligatorio.'
            }
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Products', // Tabla física de Productos
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de producto es obligatorio.'
            }
        }
    },
    priceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Prices', // Tabla física de Precios
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de precio (priceId) es obligatorio.'
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
    timestamps: true
});

// 3. Relaciones (Asociaciones)
Detalle.belongsTo(Venta, { foreignKey: 'sellId', as: 'venta' });
Venta.hasMany(Detalle, { foreignKey: 'sellId', as: 'detalles' });

Detalle.belongsTo(Product, { foreignKey: 'productId', as: 'producto' });
Product.hasMany(Detalle, { foreignKey: 'productId', as: 'detalles' });

Detalle.belongsTo(Price, { foreignKey: 'priceId', as: 'precioHistorico' });
Price.hasMany(Detalle, { foreignKey: 'priceId', as: 'detalles' });

module.exports = Detalle;
