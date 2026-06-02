const { Op } = require('sequelize');
const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta.js');
const Detalle = require('../models/detalle.js');
const Price = require('../models/price.js');
const Empleado = require('../models/empleado.js');
const Cliente = require('../models/cliente.js');
const detalleService = require('./detalleService.js');
const productService = require('./productService.js');

/**
 * Obtiene todas las ventas de un empleado con paginación, filtro por día y que solo estén activas.
 * @param {number} empleadoId ID del empleado.
 * @param {number} page Página actual (1-based).
 * @param {number} limit Límite de elementos por página.
 * @param {string} dia Fecha en formato YYYY-MM-DD para filtrar por ese día específico.
 */
exports.getByEmpleado = async (empleadoId, page = 1, limit = 10, dia = '') => {
    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 10;
    const offsetNum = (pageNum - 1) * limitNum;

    // Si no se especifica un filtro por día, se asume por defecto el día de hoy (fecha actual local)
    let filtroDia = dia;
    if (!filtroDia || filtroDia.trim() === '') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        filtroDia = `${year}-${month}-${day}`;
    }

    // Solo obtenemos las ventas que estén activas para este empleado
    const where = {
        empleadoId,
        active: true
    };

    // Filtramos por el día específico
    const startOfDay = new Date(`${filtroDia.trim()}T00:00:00.000Z`);
    const endOfDay = new Date(`${filtroDia.trim()}T23:59:59.999Z`);
    
    where.fechaEmision = {
        [Op.between]: [startOfDay, endOfDay]
    };

    const { count, rows } = await Venta.findAndCountAll({
        where,
        limit: limitNum,
        offset: offsetNum,
        include: [
            { model: Detalle, as: 'detalles' },
            { model: Empleado, as: 'empleado' },
            { model: Cliente, as: 'cliente' }
        ],
        order: [['fechaEmision', 'DESC']]
    });

    const totalPages = Math.ceil(count / limitNum);

    // Calcular ganancia para cada venta devuelta
    for (const venta of rows) {
        const ganancia = await exports.calcularGananciaVenta(venta);
        venta.setDataValue('ganancia', ganancia);
    }

    return {
        total: count,
        paginas: totalPages,
        paginaActual: pageNum,
        limite: limitNum,
        data: rows
    };
};

/**
 * Registra una venta completa y sus detalles correspondientes de forma atómica en una transacción.
 * @param {{empleadoId: number, detalles: {productId: number, priceId: number, cantidad: number}[]}} ventaData Datos validados.
 */
exports.createVenta = async (ventaData) => {
    const t = await sequelize.transaction();

    try {
        // 1. Crear la cabecera de la Venta con total inicial en 0
        const nuevaVenta = await Venta.create({
            empleadoId: ventaData.empleadoId,
            clienteId: ventaData.clienteId,
            total: 0,
            active: true
        }, { transaction: t });

        let totalVenta = 0;

        // 2. Iterar por cada detalle del DTO, verificar producto y precio, y guardarlo mediante el detalleService
        for (const item of ventaData.detalles) {
            // Buscamos el registro de precio específico enviado por el cliente
            const priceRecord = await Price.findByPk(item.priceId, { transaction: t });

            if (!priceRecord) {
                throw new Error(`El registro de precio con ID ${item.priceId} no existe.`);
            }

            // Validación de seguridad: verificamos que el precio corresponda al producto indicado
            if (priceRecord.productId !== item.productId) {
                throw new Error(`El precio con ID ${item.priceId} no pertenece al producto con ID ${item.productId}.`);
            }

            const unitPrice = Number.parseFloat(priceRecord.precio);
            const subtotal = item.cantidad * unitPrice;
            totalVenta += subtotal;

            // Guardamos el detalle en la base de datos a través de detalleService
            await detalleService.createDetalle({
                sellId: nuevaVenta.id,
                productId: item.productId,
                priceId: item.priceId,
                cantidad: item.cantidad,
                precio: unitPrice
            }, { transaction: t });
        }

        // 3. Actualizar la cabecera de la Venta con el total final calculado
        await nuevaVenta.update({ total: totalVenta }, { transaction: t });

        // 4. Confirmar la transacción
        await t.commit();

        // 5. Devolver la venta completa con sus detalles y empleado cargados
        const ventaCompleta = await Venta.findByPk(nuevaVenta.id, {
            include: [
                { model: Detalle, as: 'detalles' },
                { model: Empleado, as: 'empleado' },
                { model: Cliente, as: 'cliente' }
            ]
        });

        const ganancia = await exports.calcularGananciaVenta(ventaCompleta);
        ventaCompleta.setDataValue('ganancia', ganancia);

        return ventaCompleta;

    } catch (error) {
        // En caso de cualquier error, hacemos rollback para deshacer los cambios
        await t.rollback();
        throw error;
    }
};

/**
 * Actualiza únicamente el estado activo/inactivo de una venta.
 * @param {number} id ID de la venta.
 * @param {boolean} active Nuevo estado activo.
 */
exports.updateStatus = async (id, active) => {
    const venta = await Venta.findByPk(id, {
        include: [
            { model: Detalle, as: 'detalles' },
            { model: Empleado, as: 'empleado' },
            { model: Cliente, as: 'cliente' }
        ]
    });
    
    if (!venta) return null;

    // Actualizamos únicamente el campo active
    await venta.update({ active });

    const ganancia = await exports.calcularGananciaVenta(venta);
    venta.setDataValue('ganancia', ganancia);

    return venta;
};

/**
 * Calcula la ganancia total de una venta sumando las ganancias individuales de cada producto vendido.
 * @param {Object} venta Instancia de Venta con detalles cargados.
 * @returns {Promise<number>} La ganancia total de la venta.
 */
exports.calcularGananciaVenta = async (venta) => {
    let gananciaTotal = 0;
    if (venta?.detalles) {
        for (const detalle of venta.detalles) {
            const gananciaUnidad = await productService.getGanancia(detalle.productId, detalle.priceId);
            gananciaTotal += gananciaUnidad * detalle.cantidad;
        }
    }
    return Number.parseFloat(gananciaTotal.toFixed(2));
};
