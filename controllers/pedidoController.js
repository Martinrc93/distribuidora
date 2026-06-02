const pedidoService = require('../services/pedidoService.js');
const { pedidoCreateDto } = require('../dtos/pedido/request');
const { pedidoResponseDto } = require('../dtos/pedido/response');
const { sequelize, Pedido, Empleado, DetallePedido, Producto } = require('../models');

/**
 * Registra un nuevo recorrido/pedido
 * Ruta: POST /
 */
const registrarPedido = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { empleadoId, total, items } = req.body;

        if (!empleadoId) {
            await t.rollback();
            return res.status(400).json({ error: 'El campo empleadoId es obligatorio.' });
        }

        if (!Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'El pedido debe contener al menos un item.' });
        }

        // Fetch products to calculate ganancia (total - cost)
        const productIds = items.map(item => item.productoId);
        const products = await Producto.findAll({
            where: { id: productIds },
            transaction: t
        });

        const productMap = {};
        products.forEach(p => {
            productMap[p.id] = p;
        });

        let totalCalculado = 0;
        let gananciaCalculada = 0;

        const detalles = items.map(item => {
            const product = productMap[item.productoId];
            const costoUnitario = product ? parseFloat(product.costo) : 0;
            const subtotal = parseFloat(item.subtotal || 0);
            const cantidad = parseInt(item.cantidad, 10);
            const precioUnitario = cantidad > 0 ? (subtotal / cantidad) : 0;
            const gananciaItem = subtotal - (costoUnitario * cantidad);

            totalCalculado += subtotal;
            gananciaCalculada += gananciaItem;

            return {
                productoId: item.productoId,
                cantidad: cantidad,
                precioListaSeleccionado: item.precioListaSeleccionado || 'precioLista1',
                precioUnitario: precioUnitario,
                subtotal: subtotal
            };
        });

        // Crear el pedido
        const nuevoPedido = await Pedido.create({
            empleadoId: parseInt(empleadoId, 10),
            total: total !== undefined ? parseFloat(total) : totalCalculado,
            ganancia: gananciaCalculada,
            estado: 'Pendiente',
            active: true
        }, { transaction: t });

        // Asignar el pedidoId recién creado a cada detalle
        const detallesConPedidoId = detalles.map(d => ({
            ...d,
            pedidoId: nuevoPedido.id
        }));

        // bulkCreate de DetallePedido
        await DetallePedido.bulkCreate(detallesConPedidoId, { transaction: t });

        // Confirmar la transacción
        await t.commit();

        // Obtener el pedido completo con relaciones para responder usando el DTO
        const pedidoCompleto = await Pedido.findByPk(nuevoPedido.id, {
            include: [
                { model: Empleado, as: 'empleado' },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' }
                    ]
                }
            ]
        });

        const responseData = pedidoResponseDto.fromModel(pedidoCompleto);
        res.status(201).json(responseData);
    } catch (error) {
        await t.rollback();
        console.error('Error al registrar pedido:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtiene el listado de todos los pedidos de la base de datos con sus relaciones.
 * Ruta: GET /
 */
const obtenerPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.findAll({
            include: [
                { model: Empleado, as: 'empleado' },
                { 
                    model: DetallePedido, 
                    as: 'detalles',
                    include: [
                        { model: Producto, as: 'producto' }
                    ]
                }
            ]
        });

        res.status(200).json(pedidoResponseDto.fromModel(pedidos));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtiene el listado de todos los pedidos del día actual
 * Ruta: GET /del-dia
 */
const getPedidosDelDia = async (req, res) => {
    try {
        const pedidos = await pedidoService.obtenerPedidosDelDia();
        res.status(200).json(pedidoResponseDto.fromModel(pedidos));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registrarPedido,
    obtenerPedidos,
    getPedidosDelDia
};