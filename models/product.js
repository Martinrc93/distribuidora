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
    marca: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'La marca es obligatoria.' // Error amigable si es null
            },
            notEmpty: {
                msg: 'La marca no puede estar vacía.' // Error amigable si envían ""
            }
        },
        set(value) {
            // 3. Setter más seguro: solo hacemos trim si realmente es un string
            if (typeof value === 'string') {
                this.setDataValue('marca', value.trim());
            }
        }
    }
},
    {
        sequelize, // Pasamos la instancia de conexión
        modelName: 'Product', // Nombre del modelo
        timestamps: true   // Mantiene createdAt y updatedAt
    });

// 4. No olvides exportarlo para usarlo en tus controladores
module.exports = Product;