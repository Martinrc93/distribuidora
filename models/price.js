const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');
const Product = require('./product.js');

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
                args: [0],
                msg: 'El precio no puede ser negativo.' // Error amigable si es negativo
            }
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Products', // Hace referencia a la tabla Products
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de producto es obligatorio.'
            }
        }
    },
    listaPrecioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'ListaPrecios',
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de la lista de precios es obligatorio.'
            }
        }
    }
}, {
    sequelize,         // Instancia de conexión
    modelName: 'Price', // Nombre del modelo (generará la tabla "Prices" en plural)
    timestamps: true   // Mantiene createdAt y updatedAt automáticamente
});

// 3. Definición de Relaciones (Asociaciones)
const ListaPrecio = require('./listaPrecio.js');

Price.belongsTo(Product, { foreignKey: 'productId', as: 'producto' });
Product.hasMany(Price, { 
    foreignKey: 'productId', 
    as: 'precios',
    onDelete: 'CASCADE',  // Eliminar precios cuando se elimine el producto
    onUpdate: 'CASCADE'
});

Price.belongsTo(ListaPrecio, { foreignKey: 'listaPrecioId', as: 'listaPrecio' });
ListaPrecio.hasMany(Price, {
    foreignKey: 'listaPrecioId',
    as: 'precios',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

module.exports = Price;
