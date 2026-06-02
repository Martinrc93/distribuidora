const sequelize = require('../config/db/dataBase.js');

// Importar Modelos
const Producto = require('./Producto.js');
const Empleado = require('./Empleado.js');
const Pedido = require('./Pedido.js');
const DetallePedido = require('./DetallePedido.js');
const Price = require('./price.js');
const User = require('./user.js');

// Definir Asociaciones

// Empleado <-> Pedido
Empleado.hasMany(Pedido, { foreignKey: 'empleadoId', as: 'pedidos' });
Pedido.belongsTo(Empleado, { foreignKey: 'empleadoId', as: 'empleado' });

// Pedido <-> DetallePedido
Pedido.hasMany(DetallePedido, { foreignKey: 'pedidoId', as: 'detalles' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedidoId', as: 'pedido' });

// Producto <-> DetallePedido
Producto.hasMany(DetallePedido, { foreignKey: 'productoId', as: 'detalles' });
DetallePedido.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

// Producto <-> Price (Historial de Precios)
Producto.hasMany(Price, { foreignKey: 'productId', as: 'precios' });
Price.belongsTo(Producto, { foreignKey: 'productId', as: 'producto' });

// Price <-> DetallePedido
Price.hasMany(DetallePedido, { foreignKey: 'priceId', as: 'detalles' });
DetallePedido.belongsTo(Price, { foreignKey: 'priceId', as: 'precioHistorico' });

// Exportar todo unificado
module.exports = {
    sequelize,
    Producto,
    Empleado,
    Pedido,
    DetallePedido,
    Price,
    User
};