const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');

// 1. Usamos sintaxis de Clases (ideal para escalar)
class Product extends Model {
}

// 2. Inicializamos el modelo
Product.init({
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El nombre es obligatorio.' // Error amigable si es null
            },
            notEmpty: {
                msg: 'El nombre no puede estar vacío.' // Error amigable si envían ""
            }
        },
        set(value) {
            // 3. Setter más seguro: solo hacemos trim si realmente es un string
            if (typeof value === 'string') {
                this.setDataValue('nombre', value.trim());
            }
        }
    },
    marcaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Marcas',
            key: 'id'
        },
        validate: {
            notNull: {
                msg: 'El ID de la marca es obligatorio.'
            }
        }
    },
    costo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El costo es obligatorio.'
            },
            min: {
                args: [0],
                msg: 'El costo no puede ser negativo.'
            }
        }
    },
    costo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El costo es obligatorio.'
            },
            min: {
                args: [0],
                msg: 'El costo no puede ser negativo.'
            }
        }
    }
},
    {
        sequelize, // Pasamos la instancia de conexión
        modelName: 'Product', // Nombre del modelo
        timestamps: true   // Mantiene createdAt y updatedAt
    });

const Marca = require('./marca.js');
Product.belongsTo(Marca, { foreignKey: 'marcaId', as: 'marca' });
Marca.hasMany(Product, { 
    foreignKey: 'marcaId', 
    as: 'productos',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

module.exports = Product;