const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');

// 1. Usamos sintaxis de Clases (ideal para escalar)
class Producto extends Model {
}

// 2. Inicializamos el modelo
Producto.init({
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
    },
    costo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notNull: { msg: 'El costo es obligatorio.' }
        }
    }
},
    {
        sequelize, // Pasamos la instancia de conexión
        modelName: 'Producto', // Nombre del modelo
        timestamps: true   // Mantiene createdAt y updatedAt
    });

<<<<<<< Updated upstream:models/Producto.js
// 4. No olvides exportarlo para usarlo en tus controladores
module.exports = Producto;
=======
// 4. Relaciones (se configuran después de crear todos los modelos en los archivos correspondientes)
// No olvides exportarlo para usarlo en tus controladores
module.exports = Product;
>>>>>>> Stashed changes:models/product.js
