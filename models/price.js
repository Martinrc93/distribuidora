const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');
<<<<<<< Updated upstream
const Producto = require('./Producto.js');
=======
const Product = require('./product.js');
const ListaPrecios = require('./listaPrecios.js');
>>>>>>> Stashed changes

// 1. Usamos la sintaxis de clases (idéntica a User, Product y Empleado)
class Price extends Model {
}

// 2. Inicializamos el modelo de Price
Price.init({
    precioLista1: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El precio de la lista 1 no puede ser negativo.'
            }
        }
    },
    precioLista2: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El precio de la lista 2 no puede ser negativo.'
            }
        }
    },
    precioLista3: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El precio de la lista 3 no puede ser negativo.'
            }
        }
    },
    precioLista4: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El precio de la lista 4 no puede ser negativo.'
            }
        }
    },
    precioLista5: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El precio de la lista 5 no puede ser negativo.'
            }
        }
    },
    precioLista6: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El precio de la lista 6 no puede ser negativo.'
            }
        }
    },
    precioLista7: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: {
                args: [0],
                msg: 'El precio de la lista 7 no puede ser negativo.'
            }
        }
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'productos', // Hace referencia a la tabla productos
            key: 'id'
        },
        unique: 'composite_product_price_list',
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
        unique: 'composite_product_price_list',
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
    timestamps: true   // Mantiene createdAt y updatedAt automáticamente
});

<<<<<<< Updated upstream
=======
// 3. Definición de Relaciones (Asociaciones)
Price.belongsTo(Product, { foreignKey: 'productId', as: 'producto' });
Product.hasMany(Price, { 
    foreignKey: 'productId', 
    as: 'precios',
    onDelete: 'CASCADE',  // Eliminar precios cuando se elimine el producto
    onUpdate: 'CASCADE'
});

Price.belongsTo(ListaPrecios, { foreignKey: 'listaPreciosId', as: 'listaPrecios' });
ListaPrecios.hasMany(Price, {
    foreignKey: 'listaPreciosId',
    as: 'precios',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

>>>>>>> Stashed changes
module.exports = Price;
