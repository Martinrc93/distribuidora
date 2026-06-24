const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');

// 1. Usamos la sintaxis de clases (idéntica a User y Product)
class Empleado extends Model {
}

// 2. Inicializamos el modelo de Empleado
Empleado.init({
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
            // Setter seguro: hace trim si realmente es un string
            if (typeof value === 'string') {
                this.setDataValue('nombre', value.trim());
            }
        }
    },
    apellido: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El apellido es obligatorio.' // Error amigable si es null
            },
            notEmpty: {
                msg: 'El apellido no puede estar vacío.' // Error amigable si envían ""
            }
        },
        set(value) {
            // Setter seguro: hace trim si realmente es un string
            if (typeof value === 'string') {
                this.setDataValue('apellido', value.trim());
            }
        }
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
            notNull: {
                msg: 'El estado es obligatorio.'
            }
        }
    }
}, {
    sequelize,         // Instancia de conexión
    modelName: 'Empleado', // Nombre del modelo (generará la tabla "Empleados" en plural)
    timestamps: true,   // Mantiene createdAt y updatedAt automáticamente
    paranoid: true,
    indexes: [
        { fields: ['activo'] }
    ]
});

module.exports = Empleado;
