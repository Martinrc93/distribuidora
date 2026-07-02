const sequelize = require('../config/db/dataBase');

/**
 * Obtener estadísticas financieras y rentabilidad.
 */
exports.getFinanceStats = async (fechaMin, fechaMax) => {
    const replacements = {
        fechaMin: `${fechaMin} 00:00:00.000`,
        fechaMax: `${fechaMax} 23:59:59.999`
    };

    // 1. Obtener KPIs generales en una sola consulta evitando duplicación y excluyendo registros eliminados (paranoid)
    const kpiQuery = `
        SELECT 
            COALESCE(SUM(v.total), 0) as totalFacturado,
            COALESCE(SUM(v.ganancia), 0) as totalGanancia,
            COUNT(v.id) as totalVentas,
            (
                SELECT COALESCE(SUM(d.cantidad * p.costo), 0)
                FROM Detalles d
                INNER JOIN Ventas v2 ON d.ventaId = v2.id
                INNER JOIN Products p ON d.productoId = p.id
                WHERE v2.activo = 1 
                  AND v2.deletedAt IS NULL 
                  AND d.deletedAt IS NULL 
                  AND p.deletedAt IS NULL
                  AND v2.fecha_emision BETWEEN :fechaMin AND :fechaMax
            ) as totalCostos
        FROM Ventas v
        WHERE v.activo = 1 AND v.deletedAt IS NULL AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax;
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
        WHERE activo = 1 AND deletedAt IS NULL AND fecha_emision BETWEEN :fechaMin AND :fechaMax
        GROUP BY date(fecha_emision)
        ORDER BY fecha ASC;
    `;
    const history = await sequelize.query(historyQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    return {
        kpis: kpis[0] || { totalFacturado: 0, totalGanancia: 0, totalVentas: 0, totalCostos: 0 },
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
        replacements.queryLimit = parseInt(limit, 10) || 10;
        limitClause = 'LIMIT :queryLimit';
    }

    // 1. Top productos más vendidos
    const topProductsQuery = `
        SELECT 
            p.id as productoId,
            p.nombre as nombre,
            COALESCE(sv.cantidadVendida, 0) as cantidadVendida,
            COALESCE(sv.totalRecaudado, 0) as totalRecaudado
        FROM Products p
        LEFT JOIN (
            SELECT 
                d.productoId,
                SUM(d.cantidad) as cantidadVendida,
                SUM(d.cantidad * d.precio) as totalRecaudado
            FROM Detalles d
            INNER JOIN Ventas v ON d.ventaId = v.id
            WHERE v.activo = 1 
              AND v.deletedAt IS NULL 
              AND d.deletedAt IS NULL
              AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax
            GROUP BY d.productoId
        ) sv ON p.id = sv.productoId
        WHERE p.deletedAt IS NULL
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
        INNER JOIN Products p ON d.productoId = p.id
        INNER JOIN Marcas m ON p.marcaId = m.id
        INNER JOIN Ventas v ON d.ventaId = v.id
        WHERE v.activo = 1 
          AND v.deletedAt IS NULL 
          AND d.deletedAt IS NULL
          AND p.deletedAt IS NULL
          AND m.deletedAt IS NULL
          AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax
        GROUP BY m.id, m.nombre
        ORDER BY totalRecaudado DESC;
    `;
    const brandStats = await sequelize.query(brandStatsQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    // 3. Cantidad total de productos en el sistema
    const totalProductsResult = await sequelize.query(`
        SELECT COUNT(id) as count FROM Products WHERE deletedAt IS NULL;
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
exports.getCommercialStats = async (fechaMin, fechaMax, limit = 10) => {
    const replacements = {
        fechaMin: `${fechaMin} 00:00:00.000`,
        fechaMax: `${fechaMax} 23:59:59.999`
    };

    let limitClause = '';
    if (limit !== 'all') {
        replacements.queryLimit = parseInt(limit, 10) || 10;
        limitClause = 'LIMIT :queryLimit';
    }

    // 1. Top clientes
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
        WHERE v.activo = 1 
          AND v.deletedAt IS NULL
          AND c.deletedAt IS NULL
          AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax
        GROUP BY c.id, c.nombre, lp.nombre
        ORDER BY totalComprado DESC
        ${limitClause};
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
        WHERE v.activo = 1 
          AND v.deletedAt IS NULL
          AND e.deletedAt IS NULL
          AND v.fecha_emision BETWEEN :fechaMin AND :fechaMax
        GROUP BY e.id, e.nombre, e.apellido
        ORDER BY totalVendido DESC;
    `;
    const employeeStats = await sequelize.query(employeeStatsQuery, { 
        replacements,
        type: sequelize.QueryTypes.SELECT 
    });

    // 3. Cantidad total de clientes en el sistema
    const totalClientsResult = await sequelize.query(`
        SELECT COUNT(id) as count FROM Clientes WHERE deletedAt IS NULL;
    `, { type: sequelize.QueryTypes.SELECT });
    const totalClientsCount = totalClientsResult[0]?.count || 0;

    return {
        topClients,
        employeeStats,
        totalClientsCount
    };
};
