const Cliente = require('../models/cliente.js');
const Venta = require('../models/venta.js');
const Detalle = require('../models/detalle.js');
const ListaPrecios = require('../models/listaPrecios.js');

/**
 * Obtiene todos los clientes con soporte para paginación.
 * @param {number} page Número de página (1-based).
 * @param {number} limit Cantidad de elementos por página.
 */
exports.getAll = async (page = 1, limit = 10) => {
    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 10;
    const offsetNum = (pageNum - 1) * limitNum;

    const { count, rows } = await Cliente.findAndCountAll({
        limit: limitNum,
        offset: offsetNum,
        include: [{ model: ListaPrecios, as: 'listaPrecios' }],
        order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limitNum);

    return {
        total: count,
        paginas: totalPages,
        paginaActual: pageNum,
        limite: limitNum,
        data: rows
    };
};

/**
 * Obtiene un cliente por su ID único.
 * @param {number} id ID del cliente.
 */
exports.getById = async (id) => {
    return await Cliente.findByPk(id, {
        include: [{ model: ListaPrecios, as: 'listaPrecios' }]
    });
};

/**
 * Crea un nuevo cliente en la base de datos.
 * @param {{nombre: string, direccion?: string, listaPreciosId: number}} clienteData Datos filtrados del cliente.
 */
exports.create = async (clienteData) => {
    const nuevoCliente = await Cliente.create({
        nombre: clienteData.nombre,
        direccion: clienteData.direccion,
        listaPreciosId: clienteData.listaPreciosId
    });
    return await nuevoCliente.reload({
        include: [{ model: ListaPrecios, as: 'listaPrecios' }]
    });
};

/**
 * Actualiza un cliente existente por su ID.
 * @param {number} id ID del cliente a actualizar.
 * @param {{nombre?: string, direccion?: string, listaPreciosId?: number}} clienteData Datos a modificar.
 */
exports.update = async (id, clienteData) => {
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return null;

    await cliente.update({
        nombre: clienteData.nombre === undefined ? cliente.nombre : clienteData.nombre,
        direccion: clienteData.direccion === undefined ? cliente.direccion : clienteData.direccion,
        listaPreciosId: clienteData.listaPreciosId === undefined ? cliente.listaPreciosId : clienteData.listaPreciosId
    });

    return await cliente.reload({
        include: [{ model: ListaPrecios, as: 'listaPrecios' }]
    });
};

/**
 * Elimina un cliente por su ID (con eliminación en cascada manual).
 * @param {number} id ID del cliente a eliminar.
 * @returns {Promise<boolean>} true si fue eliminado, false si no existía.
 */
exports.deleteCliente = async (id) => {
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return false;

    // Obtener todas las ventas del cliente
    const ventas = await Venta.findAll({
        where: { clienteId: id }
    });

    const ventaIds = ventas.map(v => v.id);

    // Si hay ventas, eliminar los detalles primero
    if (ventaIds.length > 0) {
        await Detalle.destroy({
            where: {
                sellId: ventaIds
            }
        });

        // Luego eliminar las ventas
        await Venta.destroy({
            where: { clienteId: id }
        });
    }

    // Finalmente, eliminar el cliente
    await cliente.destroy();
    return true;
};
