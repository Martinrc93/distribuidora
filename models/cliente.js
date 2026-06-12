const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/db/dataBase');
const ListaPrecio = require('./listaPrecio.js');

class Cliente extends Model {}

Cliente.init({
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notNull: {
                msg: 'El nombre es obligatorio.'
            },
            notEmpty: {
                msg: 'El nombre no puede estar vacío.'
            },
            len: {
                args: [1, 50],
                msg: 'El nombre debe tener entre 1 y 50 caracteres.'
            }
        }
    },
    direccion: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            len: {
                args: [0, 50],
                msg: 'La dirección no puede superar los 50 caracteres.'
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
                msg: 'La lista de precios es obligatoria.'
            }
        }
    }
}, {
    sequelize,
    modelName: 'Cliente',
    tableName: 'Clientes',
    timestamps: true
});

// Relaciones
Cliente.belongsTo(ListaPrecio, { foreignKey: 'listaPrecioId', as: 'listaPrecio' });
ListaPrecio.hasMany(Cliente, { foreignKey: 'listaPrecioId', as: 'clientes' });

module.exports = Cliente;
