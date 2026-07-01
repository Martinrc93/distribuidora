const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');
const Product = require('./product.js');
const ListaPrecios = require('./listaPrecios.js');

// 1. Usamos la sintaxis de clases (idéntica a User, Product y Empleado)
class Price extends Model {
}

// 2. Inicializamos el modelo de Price
Price.init({
    precio: {
        type: DataTypes.DECIMAL(10, 2), // Tipo Decimal con precisión (10 dígitos, 2 decimales)
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El precio es obligatorio.' // Error amigable si es null
            },
            min: {
                args: [0.01],
                msg: 'El precio debe ser superior a 0.'
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
    listaPreciosId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'ListaPrecios',
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'La lista de precios es obligatoria.'
            }
        }
    }
}, {
    sequelize,         // Instancia de conexión
    modelName: 'Price', // Nombre del modelo (generará la tabla "Prices" en plural)
    tableName: 'Prices',
    timestamps: true,   // Mantiene createdAt y updatedAt automáticamente
    paranoid: true,
    indexes: [
        { fields: ['productoId', 'listaPreciosId'] }
    ]
});

// 3. Definición de Relaciones (Asociaciones)
Price.belongsTo(Product, { foreignKey: 'productoId', as: 'producto' });
Product.hasMany(Price, { 
    foreignKey: 'productoId', 
    as: 'precios',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Price.belongsTo(ListaPrecios, { foreignKey: 'listaPreciosId', as: 'listaPrecios' });
ListaPrecios.hasMany(Price, {
    foreignKey: 'listaPreciosId',
    as: 'precios',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

module.exports = Price;
