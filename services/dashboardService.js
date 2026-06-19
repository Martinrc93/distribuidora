const sequelize = require('../config/db/dataBase');

/**
 * Obtener estadísticas financieras y rentabilidad.
 */
exports.getFinanceStats = async (fechaMin, fechaMax) => {
    const replacements = {
        fechaMin: `${fechaMin} 00:00:00.000`,
        fechaMax: `${fechaMax} 23:59:59.999`
    };

    // 1. Obtener KPIs generales
    const kpiQuery = `
        SELECT 
            COALESCE(SUM(total), 0) as totalFacturado,
            COALESCE(SUM(ganancia), 0) as totalGanancia,
            COUNT(id) as totalVentas
        FROM Ventas
        WHERE active = 1 AND fecha_emision BETWEEN :fechaMin AND :fechaMax;
    `;
    const kpis = await sequelize.query(kpiQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    // 2. Obtener historial diario
    const historyQuery = `
        SELECT 
            date(fecha_emision) as fecha,
            COALESCE(SUM(total), 0) as totalVentas,
            COALESCE(SUM(ganancia), 0) as totalGanancia,
            COUNT(id) as cantidadVentas
        FROM Ventas
        WHERE active = 1 AND fecha_emision BETWEEN :fechaMin AND :fechaMax
        GROUP BY date(fecha_emision)
        ORDER BY fecha ASC;
    `;
    const history = await sequelize.query(historyQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    return {
        kpis: kpis[0] || { totalFacturado: 0, totalGanancia: 0, totalVentas: 0 },
        history
    };
};

/**
 * Obtener estadísticas de mix de productos y marcas (portfolio).
 */
exports.getPortfolioStats = async (fechaMin, fechaMax, limit = 10) => {
    const replacements = {
        fechaMin: `${fechaMin} 00:00:00.000`,
        fechaMax: `${fechaMax} 23:59:59.999`
    };

    let limitClause = '';
    if (limit !== 'all') {
        const productsLimit = parseInt(limit) || 10;
        limitClause = `LIMIT ${productsLimit}`;
    }

    // 1. Top productos más vendidos (usando LEFT JOIN para incluir todos los productos si es necesario)
    const topProductsQuery = `
        SELECT 
            p.id as productId,
            p.nombre as nombre,
            COALESCE(sv.cantidadVendida, 0) as cantidadVendida,
            COALESCE(sv.totalRecaudado, 0) as totalRecaudado
        FROM Products p
        LEFT JOIN (
            SELECT 
                d.productId,
                SUM(d.cantidad) as cantidadVendida,
                SUM(d.cantidad * d.precio) as totalRecaudado
            FROM Detalles d
            INNER JOIN Ventas v ON d.sellId = v.id
            WHERE v.active = 1 AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax
            GROUP BY d.productId
        ) sv ON p.id = sv.productId
        ORDER BY cantidadVendida DESC, p.nombre ASC
        ${limitClause};
    `;
    const topProducts = await sequelize.query(topProductsQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    // 2. Ventas y ganancias por Marca
    const brandStatsQuery = `
        SELECT 
            m.id as marcaId,
            m.nombre as marcaNombre,
            SUM(d.cantidad) as cantidadVendida,
            COALESCE(SUM(d.cantidad * d.precio), 0) as totalRecaudado,
            COALESCE(SUM(d.cantidad * (d.precio - p.costo)), 0) as totalGanancia
        FROM Detalles d
        INNER JOIN Products p ON d.productId = p.id
        INNER JOIN Marcas m ON p.marcaId = m.id
        INNER JOIN Ventas v ON d.sellId = v.id
        WHERE v.active = 1 AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax
        GROUP BY m.id, m.nombre
        ORDER BY totalRecaudado DESC;
    `;
    const brandStats = await sequelize.query(brandStatsQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    // 3. Cantidad total de productos en el sistema
    const totalProductsResult = await sequelize.query(`
        SELECT COUNT(id) as count FROM Products;
    `, { type: sequelize.QueryTypes.SELECT });
    const totalProductsCount = totalProductsResult[0]?.count || 0;

    return {
        topProducts,
        brandStats,
        totalProductsCount
    };
};

/**
 * Obtener estadísticas de clientes, vendedores y listas de precios.
 */
exports.getCommercialStats = async (fechaMin, fechaMax) => {
    const replacements = {
        fechaMin: `${fechaMin} 00:00:00.000`,
        fechaMax: `${fechaMax} 23:59:59.999`
    };

    // 1. Top 10 clientes
    const topClientsQuery = `
        SELECT 
            c.id as clienteId,
            c.nombre as clienteNombre,
            lp.nombre as listaPreciosNombre,
            COALESCE(SUM(v.total), 0) as totalComprado,
            COALESCE(SUM(v.ganancia), 0) as gananciaGenerada,
            COUNT(v.id) as cantidadVentas
        FROM Ventas v
        INNER JOIN Clientes c ON v.clienteId = c.id
        INNER JOIN ListaPrecios lp ON c.listaPreciosId = lp.id
        WHERE v.active = 1 AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax
        GROUP BY c.id, c.nombre, lp.nombre
        ORDER BY totalComprado DESC
        LIMIT 10;
    `;
    const topClients = await sequelize.query(topClientsQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    // 2. Rendimiento de empleados (vendedores)
    const employeeStatsQuery = `
        SELECT 
            e.id as empleadoId,
            (e.nombre || ' ' || e.apellido) as empleadoNombre,
            COALESCE(SUM(v.total), 0) as totalVendido,
            COALESCE(SUM(v.ganancia), 0) as gananciaGenerada,
            COUNT(v.id) as cantidadVentas
        FROM Ventas v
        INNER JOIN Empleados e ON v.empleadoId = e.id
        WHERE v.active = 1 AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax
        GROUP BY e.id, e.nombre, e.apellido
        ORDER BY totalVendido DESC;
    `;
    const employeeStats = await sequelize.query(employeeStatsQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    return {
        topClients,
        employeeStats
    };
};
