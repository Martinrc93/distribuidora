const { Op } = require('sequelize');
const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta.js');
const Detalle = require('../models/detalle.js');
const Price = require('../models/price.js');
const Product = require('../models/product.js');
const Empleado = require('../models/empleado.js');
const Cliente = require('../models/cliente.js');
const Marca = require('../models/marca.js');
const detalleService = require('./detalleService.js');
const productService = require('./productService.js');

/**
 * Obtiene todas las ventas de un empleado con paginación, filtro por día y que solo estén activas.
 * @param {number} empleadoId ID del empleado.
 * @param {number} page Página actual (1-based).
 * @param {number} limit Límite de elementos por página.
 * @param {string} dia Fecha en formato YYYY-MM-DD para filtrar por ese día específico.
 */
exports.getByEmpleado = async (empleadoId, page = 1, limit = 100, dia = '', fechaMin = '', fechaMax = '') => {
    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 100;
    const offsetNum = (pageNum - 1) * limitNum;

    // Solo obtenemos las ventas que estén activas para este empleado
    const where = {
        empleadoId,
        activo: true
    };

    if (fechaMin || fechaMax) {
        const dateFilter = {};
        if (fechaMin && fechaMin.trim() !== '') {
            dateFilter[Op.gte] = new Date(`${fechaMin.trim()}T00:00:00.000`);
        }
        if (fechaMax && fechaMax.trim() !== '') {
            dateFilter[Op.lte] = new Date(`${fechaMax.trim()}T23:59:59.999`);
        }
        where.fechaEmision = dateFilter;
    } else {
        // Si no se especifica un filtro por día ni rango, se asume por defecto el día de hoy (fecha actual local)
        let filtroDia = dia;
        if (!filtroDia || filtroDia.trim() === '') {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            filtroDia = `${year}-${month}-${day}`;
        }

        const startOfDay = new Date(`${filtroDia.trim()}T00:00:00.000`);
        const endOfDay = new Date(`${filtroDia.trim()}T23:59:59.999`);
        
        where.fechaEmision = {
            [Op.between]: [startOfDay, endOfDay]
        };
    }

    const { count, rows } = await Venta.findAndCountAll({
        where,
        limit: limitNum,
        offset: offsetNum,
        include: [
            { model: Detalle, as: 'detalles' },
            { model: Empleado, as: 'empleado' },
            { model: Cliente, as: 'cliente' },
        ],
        order: [
            [sequelize.literal('ordenImpresion IS NULL'), 'ASC'],
            ['ordenImpresion', 'ASC'],
            ['fechaEmision', 'DESC']
        ]
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
 * Registra una venta completa y sus detalles correspondientes de forma atómica en una transacción.
 * @param {{empleadoId: number, detalles: {productId: number, priceId: number, cantidad: number}[]}} ventaData Datos validados.
 */
exports.createVenta = async (ventaData) => {
    const t = await sequelize.transaction();

    try {
        // Pre-fetch all products with their brands to sort and reuse
        const productIds = ventaData.detalles.map(d => d.productoId);
        const products = await Product.findAll({
            where: { id: productIds },
            include: [{ model: Marca, as: 'marca' }],
            transaction: t,
            paranoid: false
        });

        const productMap = {};
        for (const p of products) {
            productMap[p.id] = p;
        }

        // Sort details: brand name ASC, then product name ASC
        ventaData.detalles.sort((a, b) => {
            const prodA = productMap[a.productoId];
            const prodB = productMap[b.productoId];
            
            const brandA = (prodA && prodA.marca && prodA.marca.nombre) ? prodA.marca.nombre.toLowerCase() : '';
            const brandB = (prodB && prodB.marca && prodB.marca.nombre) ? prodB.marca.nombre.toLowerCase() : '';
            
            const brandCompare = brandA.localeCompare(brandB, 'es', { sensitivity: 'base' });
            if (brandCompare !== 0) return brandCompare;
            
            const nameA = (prodA && prodA.nombre) ? prodA.nombre.toLowerCase() : '';
            const nameB = (prodB && prodB.nombre) ? prodB.nombre.toLowerCase() : '';
            
            return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
        });

        // 1. Crear la cabecera de la Venta con total y ganancia iniciales en 0
        // Se crea con ordenImpresion: 0 para que al normalizar sea el primer elemento
        const nuevaVenta = await Venta.create({
            empleadoId: ventaData.empleadoId,
            clienteId: ventaData.clienteId,
            ordenImpresion: 0,
            total: 0,
            ganancia: 0,
            activo: true
        }, { transaction: t });

        let totalVenta = 0;
        let totalGanancia = 0;

        // 2. Iterar por cada detalle del DTO, verificar producto y precio, y guardarlo mediante el detalleService
        for (const item of ventaData.detalles) {
            // Buscamos el registro de precio específico enviado por el cliente (incluyendo precios históricamente eliminados/recreados)
            const priceRecord = await Price.findByPk(item.precioId, { transaction: t, paranoid: false });

            if (!priceRecord) {
                throw new Error(`El registro de precio con ID ${item.precioId} no existe.`);
            }

            // Validación de seguridad: verificamos que el precio corresponda al producto indicado
            if (priceRecord.productoId !== item.productoId) {
                throw new Error(`El precio con ID ${item.precioId} no pertenece al producto con ID ${item.productoId}.`);
            }

            // Obtener el costo del producto para el cálculo de la ganancia
            const product = productMap[item.productoId];
            if (!product) {
                throw new Error(`El producto con ID ${item.productoId} no existe.`);
            }
            const productCost = Number.parseFloat(product.costo);

            // Si se envió un precio personalizado, usarlo; de lo contrario, usar el precio de lista
            let unitPrice;
            if (item.precio !== undefined && item.precio !== null && !isNaN(Number(item.precio))) {
                unitPrice = Number.parseFloat(item.precio);
            } else {
                unitPrice = Number.parseFloat(priceRecord.precio);
            }

            const subtotal = item.cantidad * unitPrice;
            totalVenta += subtotal;

            // Calcular ganancia unitaria acumulada
            const gananciaUnidad = Number.parseFloat((unitPrice - productCost).toFixed(2));
            totalGanancia += gananciaUnidad * item.cantidad;

            // Guardamos el detalle en la base de datos a través de detalleService
            await detalleService.createDetalle({
                ventaId: nuevaVenta.id,
                productoId: item.productoId,
                precioId: item.precioId,
                cantidad: item.cantidad,
                precio: unitPrice
            }, { transaction: t });
        }

        // 3. Actualizar la cabecera de la Venta con el total y ganancia finales calculados
        await nuevaVenta.update({
            total: totalVenta,
            ganancia: Number.parseFloat(totalGanancia.toFixed(2))
        }, { transaction: t });

        // 4. Confirmar la transacción
        await t.commit();

        // 5. Normalizar el orden de impresión de todas las ventas del día (fuera de la transacción)
        await exports.normalizarOrdenesDia(nuevaVenta.fechaEmision);

        // 5. Devolver la venta completa con sus detalles y empleado cargados
        return await Venta.findByPk(nuevaVenta.id, {
            include: [
                { model: Detalle, as: 'detalles' },
                { model: Empleado, as: 'empleado' },
                { model: Cliente, as: 'cliente' }
            ]
        });

    } catch (error) {
        // En caso de cualquier error, hacemos rollback para deshacer los cambios
        await t.rollback();
        throw error;
    }
};

/**
 * Actualiza el estado activo/inactivo de una venta y, opcionalmente, sus detalles asociados de forma atómica.
 * @param {number} id ID de la venta.
 * @param {boolean} activo Nuevo estado activo.
 * @param {Array} detalles Listado opcional de nuevos detalles [{productoId, precioId, cantidad}].
 * @param {number|null} empleadoId ID del nuevo empleado a cargo opcional.
 * @param {number|null} clienteId ID del nuevo cliente opcional.
 */
exports.updateVenta = async (id, activo, detalles = null, empleadoId = null, clienteId = null) => {
    const t = await sequelize.transaction({ type: 'IMMEDIATE' });

    try {
        const venta = await Venta.findByPk(id, { transaction: t });
        if (!venta) {
            await t.rollback();
            return null;
        }
        // 1. Actualizar el estado activo, empleadoId, clienteId e inicializar o limpiar ordenImpresion
        const oldActivo = venta.activo;
        const oldEmpleadoId = venta.empleadoId;
        const oldClienteId = venta.clienteId;
        let nextOrdenImpresion = venta.ordenImpresion;
        let targetEmpleadoId = oldEmpleadoId;
        let targetClienteId = oldClienteId;

        if (empleadoId !== null && empleadoId !== undefined) {
            const empIdNum = Number.parseInt(empleadoId, 10);
            if (!Number.isNaN(empIdNum) && empIdNum > 0 && empIdNum !== oldEmpleadoId) {
                const emp = await Empleado.findByPk(empIdNum, { transaction: t });
                if (!emp) {
                    throw new Error(`El empleado con ID ${empIdNum} no existe.`);
                }
                targetEmpleadoId = empIdNum;
                if (activo) {
                    nextOrdenImpresion = 0;
                }
            }
        }

        if (clienteId !== null && clienteId !== undefined) {
            const cliIdNum = Number.parseInt(clienteId, 10);
            if (!Number.isNaN(cliIdNum) && cliIdNum > 0 && cliIdNum !== oldClienteId) {
                const cli = await Cliente.findByPk(cliIdNum, { transaction: t });
                if (!cli) {
                    throw new Error(`El cliente con ID ${cliIdNum} no existe.`);
                }
                targetClienteId = cliIdNum;
            }
        }

        if (activo !== oldActivo) {
            if (!activo) {
                nextOrdenImpresion = null;
            } else {
                nextOrdenImpresion = 0; // reactivado se carga como primero
            }
        }
        await venta.update({ activo, empleadoId: targetEmpleadoId, clienteId: targetClienteId, ordenImpresion: nextOrdenImpresion }, { transaction: t });

        // 2. Si se envían nuevos detalles, actualizarlos de forma atómica
        if (detalles) {
            // Pre-fetch all products with their brands to sort and reuse
            const productIds = detalles.map(d => d.productoId);
            const products = await Product.findAll({
                where: { id: productIds },
                include: [{ model: Marca, as: 'marca' }],
                transaction: t,
                paranoid: false
            });

            const productMap = {};
            for (const p of products) {
                productMap[p.id] = p;
            }

            // Sort details: brand name ASC, then product name ASC
            detalles.sort((a, b) => {
                const prodA = productMap[a.productoId];
                const prodB = productMap[b.productoId];
                
                const brandA = (prodA && prodA.marca && prodA.marca.nombre) ? prodA.marca.nombre.toLowerCase() : '';
                const brandB = (prodB && prodB.marca && prodB.marca.nombre) ? prodB.marca.nombre.toLowerCase() : '';
                
                const brandCompare = brandA.localeCompare(brandB, 'es', { sensitivity: 'base' });
                if (brandCompare !== 0) return brandCompare;
                
                const nameA = (prodA && prodA.nombre) ? prodA.nombre.toLowerCase() : '';
                const nameB = (prodB && prodB.nombre) ? prodB.nombre.toLowerCase() : '';
                
                return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
            });

            // Eliminar detalles previos de la venta
            await Detalle.destroy({
                where: { ventaId: id },
                transaction: t
            });

            let totalVenta = 0;
            let totalGanancia = 0;

            // Registrar los nuevos detalles
            for (const item of detalles) {
                const priceRecord = await Price.findByPk(item.precioId, { transaction: t, paranoid: false });
                if (!priceRecord) {
                    throw new Error(`El registro de precio con ID ${item.precioId} no existe.`);
                }
                if (priceRecord.productoId !== item.productoId) {
                    throw new Error(`El precio con ID ${item.precioId} no pertenece al producto con ID ${item.productoId}.`);
                }

                // Obtener el costo del producto para el cálculo de la ganancia
                const product = productMap[item.productoId];
                if (!product) {
                    throw new Error(`El producto con ID ${item.productoId} no existe.`);
                }
                const productCost = Number.parseFloat(product.costo);

                // Si se envió un precio personalizado, usarlo; de lo contrario, usar el precio de lista
                let unitPrice;
                if (item.precio !== undefined && item.precio !== null && !isNaN(Number(item.precio))) {
                    unitPrice = Number.parseFloat(item.precio);
                } else {
                    unitPrice = Number.parseFloat(priceRecord.precio);
                }

                const subtotal = item.cantidad * unitPrice;
                totalVenta += subtotal;

                // Calcular ganancia acumulada
                const gananciaUnidad = Number.parseFloat((unitPrice - productCost).toFixed(2));
                totalGanancia += gananciaUnidad * item.cantidad;

                // Crear el detalle en la DB
                await detalleService.createDetalle({
                    ventaId: id,
                    productoId: item.productoId,
                    precioId: item.precioId,
                    cantidad: item.cantidad,
                    precio: unitPrice
                }, { transaction: t });
            }

            // Actualizar el total y ganancia de la cabecera
            await venta.update({
                total: totalVenta,
                ganancia: Number.parseFloat(totalGanancia.toFixed(2))
            }, { transaction: t });
        }

        await t.commit();

        // 3. Normalizar el orden de impresión de todas las ventas del día (fuera de la transacción)
        await exports.normalizarOrdenesDia(venta.fechaEmision);

        // Retornar la venta actualizada con todas las relaciones cargadas
        return await Venta.findByPk(id, {
            include: [
                { model: Detalle, as: 'detalles' },
                { model: Empleado, as: 'empleado' },
                { model: Cliente, as: 'cliente' }
            ]
        });

    } catch (error) {
        await t.rollback();
        throw error;
    }
};

// Mantener compatibilidad por si acaso
exports.updateStatus = exports.updateVenta;

/**
 * Obtiene la última venta activa realizada para un cliente específico.
 * @param {number} clienteId ID del cliente.
 */
exports.getUltimaVenta = async (clienteId) => {
    const clId = Number.parseInt(clienteId, 10);
    if (Number.isNaN(clId)) {
        throw new TypeError('El ID de cliente debe ser un número válido.');
    }

    return await Venta.findOne({
        where: {
            clienteId: clId,
            activo: true
        },
        include: [
            { model: Detalle, as: 'detalles' },
            { model: Empleado, as: 'empleado' },
            { model: Cliente, as: 'cliente' }
        ],
        order: [['fechaEmision', 'DESC']]
    });
};

/**
 * Obtiene todas las ventas activas de un cliente con paginación y filtros opcionales de fecha.
 * @param {number} clienteId ID del cliente.
 * @param {number} page Página actual (1-based).
 * @param {number} limit Límite de elementos por página.
 * @param {string} fechaMin Fecha mínima (YYYY-MM-DD).
 * @param {string} fechaMax Fecha máxima (YYYY-MM-DD).
 */
exports.getByCliente = async (clienteId, page = 1, limit = 100, fechaMin = '', fechaMax = '') => {
    const clId = Number.parseInt(clienteId, 10);
    if (Number.isNaN(clId)) {
        throw new TypeError('El ID de cliente debe ser un número válido.');
    }

    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 100;
    const offsetNum = (pageNum - 1) * limitNum;

    const where = {
        clienteId: clId,
        activo: true
    };

    const dateFilter = {};
    let hasDateFilter = false;

    if (fechaMin && fechaMin.trim() !== '') {
        dateFilter[Op.gte] = new Date(`${fechaMin.trim()}T00:00:00.000`);
        hasDateFilter = true;
    }

    if (fechaMax && fechaMax.trim() !== '') {
        dateFilter[Op.lte] = new Date(`${fechaMax.trim()}T23:59:59.999`);
        hasDateFilter = true;
    }

    if (hasDateFilter) {
        where.fechaEmision = dateFilter;
    }

    const { count, rows } = await Venta.findAndCountAll({
        where,
        limit: limitNum,
        offset: offsetNum,
        include: [
            { model: Detalle, as: 'detalles' },
            { model: Empleado, as: 'empleado' },
            { model: Cliente, as: 'cliente' },
        ],
        order: [
            [sequelize.literal('ordenImpresion IS NULL'), 'ASC'],
            ['ordenImpresion', 'ASC'],
            ['fechaEmision', 'DESC']
        ]
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
 * Obtiene todas las ventas con soporte para paginación y filtros de fecha opcionales.
 * @param {number} page Número de página (1-based).
 * @param {number} limit Cantidad de elementos por página.
 * @param {string} dia Fecha en formato YYYY-MM-DD para filtrar por ese día específico.
 * @param {string} fechaMin Fecha mínima (YYYY-MM-DD).
 * @param {string} fechaMax Fecha máxima (YYYY-MM-DD).
 */
exports.getAll = async (page = 1, limit = 100, dia = '', fechaMin = '', fechaMax = '') => {
    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 100;
    const offsetNum = (pageNum - 1) * limitNum;

    const where = {};

    if (fechaMin || fechaMax) {
        const dateFilter = {};
        if (fechaMin && fechaMin.trim() !== '') {
            dateFilter[Op.gte] = new Date(`${fechaMin.trim()}T00:00:00.000`);
        }
        if (fechaMax && fechaMax.trim() !== '') {
            dateFilter[Op.lte] = new Date(`${fechaMax.trim()}T23:59:59.999`);
        }
        where.fechaEmision = dateFilter;
    } else if (dia && dia.trim() !== '') {
        const startOfDay = new Date(`${dia.trim()}T00:00:00.000`);
        const endOfDay = new Date(`${dia.trim()}T23:59:59.999`);
        where.fechaEmision = {
            [Op.between]: [startOfDay, endOfDay]
        };
    }

    const { count, rows } = await Venta.findAndCountAll({
        where,
        limit: limitNum,
        offset: offsetNum,
        include: [
            { model: Detalle, as: 'detalles' },
            { model: Empleado, as: 'empleado' },
            { model: Cliente, as: 'cliente' },
        ],
        order: [
            [sequelize.literal('ordenImpresion IS NULL'), 'ASC'],
            ['ordenImpresion', 'ASC'],
            ['fechaEmision', 'DESC']
        ]
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
 * Actualiza el número de orden de impresión de una venta.
 * Valida que el número sea único entre las ventas activas.
 * @param {number} id ID de la venta.
 * @param {number|null} numero Número de orden de impresión o null para quitarlo.
 */
exports.updateOrdenImpresion = async (id, numero) => {
    const t = await sequelize.transaction();
    try {
        const venta = await Venta.findByPk(id, { transaction: t });
        if (!venta) {
            await t.rollback();
            return null;
        }

        if (numero !== null) {
            const year = venta.fechaEmision.getFullYear();
            const month = String(venta.fechaEmision.getMonth() + 1).padStart(2, '0');
            const day = String(venta.fechaEmision.getDate()).padStart(2, '0');
            
            const startOfDay = new Date(`${year}-${month}-${day}T00:00:00.000`);
            const endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999`);

            const existing = await Venta.findOne({
                where: {
                    ordenImpresion: numero,
                    activo: true,
                    empleadoId: venta.empleadoId,
                    id: { [Op.ne]: id },
                    fechaEmision: {
                        [Op.between]: [startOfDay, endOfDay]
                    }
                },
                transaction: t
            });
            if (existing) {
                // Si el número ya existe, los intercambiamos automáticamente en lugar de tirar error
                await exports.swapOrdenImpresion(id, existing.id, t);
            } else {
                await venta.update({ ordenImpresion: numero }, { transaction: t });
            }
        } else {
            await venta.update({ ordenImpresion: numero }, { transaction: t });
        }
        
        await t.commit();

        await exports.normalizarOrdenesDia(venta.fechaEmision);

        return await Venta.findByPk(id, {
            include: [
                { model: Detalle, as: 'detalles' },
                { model: Empleado, as: 'empleado' },
                { model: Cliente, as: 'cliente' }
            ]
        });
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

/**
 * Intercambia los valores de ordenImpresion entre dos ventas.
 * @param {number} id1 ID de la primera venta.
 * @param {number} id2 ID de la segunda venta.
 * @param {object|null} transaction Transacción opcional.
 */
exports.swapOrdenImpresion = async (id1, id2, transaction = null) => {
    let t = transaction;
    let localTransaction = false;
    if (!t) {
        t = await sequelize.transaction();
        localTransaction = true;
    }

    try {
        const venta1 = await Venta.findByPk(id1, { transaction: t });
        const venta2 = await Venta.findByPk(id2, { transaction: t });

        if (!venta1 || !venta2) {
            throw new Error('Una o ambas ventas no existen.');
        }

        if (!venta1.activo || !venta2.activo) {
            const err = new Error('No se puede cambiar el orden de pedidos inactivos o cancelados.');
            err.isClientError = true;
            throw err;
        }

        if (venta1.empleadoId !== venta2.empleadoId) {
            const err = new Error('No se puede cambiar el orden entre pedidos de diferentes empleados.');
            err.isClientError = true;
            throw err;
        }

        const orden1 = venta1.ordenImpresion;
        const orden2 = venta2.ordenImpresion;

        // Se usa un valor temporal negativo para evitar colisiones de unicidad si hubiese constraints
        await venta1.update({ ordenImpresion: -1 }, { transaction: t });
        await venta2.update({ ordenImpresion: orden1 }, { transaction: t });
        await venta1.update({ ordenImpresion: orden2 }, { transaction: t });

        await exports.normalizarOrdenesDia(venta1.fechaEmision, t);

        if (localTransaction) {
            await t.commit();
        }
        return true;
    } catch (error) {
        if (localTransaction) {
            await t.rollback();
        }
        throw error;
    }
};

/**
 * Normaliza los números de ordenImpresion para que sean correlativos a partir de 1.
 * Limpia también el ordenImpresion de las ventas canceladas.
 */
exports.normalizarOrdenesDia = async (fecha, transaction = null) => {
    let t = transaction;
    let localTransaction = false;
    if (!t) {
        t = await sequelize.transaction();
        localTransaction = true;
    }

    try {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const startOfDay = new Date(`${year}-${month}-${day}T00:00:00.000`);
        const endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999`);

        const ventasDia = await Venta.findAll({
            where: {
                fechaEmision: { [Op.between]: [startOfDay, endOfDay] }
            },
            transaction: t
        });

        // 1. Limpiar ordenImpresion de las canceladas
        for (const v of ventasDia) {
            if (!v.activo && v.ordenImpresion !== null) {
                await Venta.update({ ordenImpresion: null }, { where: { id: v.id }, transaction: t });
            }
        }

        // 2. Agrupar por empleadoId
        const ventasPorEmpleado = {};
        for (const v of ventasDia) {
            if (v.activo) {
                if (!ventasPorEmpleado[v.empleadoId]) {
                    ventasPorEmpleado[v.empleadoId] = [];
                }
                ventasPorEmpleado[v.empleadoId].push(v);
            }
        }

        // 3. Ordenar y re-asignar correlativos por empleado
        for (const empId of Object.keys(ventasPorEmpleado)) {
            const ventasActivas = ventasPorEmpleado[empId];
            ventasActivas.sort((a, b) => {
                const aOrden = a.ordenImpresion !== null ? a.ordenImpresion : Infinity;
                const bOrden = b.ordenImpresion !== null ? b.ordenImpresion : Infinity;
                if (aOrden !== bOrden) return aOrden - bOrden;
                
                const aFecha = new Date(a.fechaEmision).getTime();
                const bFecha = new Date(b.fechaEmision).getTime();
                if (aFecha !== bFecha) return aFecha - bFecha;
                
                return a.id - b.id;
            });

            for (let i = 0; i < ventasActivas.length; i++) {
                const v = ventasActivas[i];
                const nuevoOrden = i + 1;
                if (v.ordenImpresion !== nuevoOrden) {
                    await Venta.update({ ordenImpresion: nuevoOrden }, { where: { id: v.id }, transaction: t });
                }
            }
        }

        if (localTransaction) {
            await t.commit();
        }
    } catch (error) {
        if (localTransaction) {
            await t.rollback();
        }
        throw error;
    }
};

