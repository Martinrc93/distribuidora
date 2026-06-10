const { DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase.js');

const Empleado = sequelize.define('Empleado', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombreCompleto: {
        type: DataTypes.STRING,
<<<<<<< Updated upstream
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
=======
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
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        validate: {
            notNull: {
                msg: 'El estado es obligatorio.'
            }
        }
>>>>>>> Stashed changes
    }
}, {
    tableName: 'empleados',
    timestamps: true
});

module.exports = Empleado;