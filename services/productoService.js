const { Producto } = require('../models/index.js');

/**
 * Crea un nuevo producto.
 * @param {Object} datos - Datos validados del producto
 * @returns {Object} Instancia del producto creado
 */
const crearProducto = async (datos) => {
    return await Producto.create(datos);
};

/**
 * Obtiene todos los productos registrados.
 * @returns {Array} Lista de instancias de productos
 */
const obtenerTodos = async () => {
    return await Producto.findAll();
};

/**
 * Obtiene un producto por su ID.
 * @param {number} id - Identificador del producto
 * @returns {Object|null} Instancia del producto o null si no existe
 */
const obtenerPorId = async (id) => {
    return await Producto.findByPk(id);
};

/**
 * Actualiza un producto específico por su ID.
 * @param {number} id - Identificador del producto
 * @param {Object} nuevosDatos - Datos con las actualizaciones a aplicar
 */
const actualizarProducto = async (id, nuevosDatos) => {
    const producto = await Producto.findByPk(id);
    if (!producto) return null;

    await producto.update(nuevosDatos);
    return producto;
};

/**
 * Elimina un producto por su ID.
 * @param {number} id - Identificador del producto
 * @returns {boolean} true si fue eliminado, false si no existía
 */
const eliminarProducto = async (id) => {
    const producto = await Producto.findByPk(id);
    if (!producto) return false;
    
    await producto.destroy();
    return true;
};

module.exports = {
    crearProducto,
    obtenerTodos,
    obtenerPorId,
    actualizarProducto,
    eliminarProducto
 };
