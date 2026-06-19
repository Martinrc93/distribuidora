const dashboardService = require('../services/dashboardService');

// Helper para formatear fecha local en YYYY-MM-DD
const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Obtener fechas por defecto: hoy y hace 14 días
const getDefaultDates = () => {
    const today = new Date();
    const defaultFechaMax = getLocalDateString(today);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);
    const defaultFechaMin = getLocalDateString(fourteenDaysAgo);

    return { defaultFechaMin, defaultFechaMax };
};

/**
 * Obtener estadísticas financieras y rentabilidad.
 * GET /dashboard/finance?fechaMin=YYYY-MM-DD&fechaMax=YYYY-MM-DD
 */
exports.getFinanceStats = async (req, res) => {
    try {
        const { defaultFechaMin, defaultFechaMax } = getDefaultDates();
        const fechaMin = req.query.fechaMin || defaultFechaMin;
        const fechaMax = req.query.fechaMax || defaultFechaMax;

        const stats = await dashboardService.getFinanceStats(fechaMin, fechaMax);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener estadísticas de mix de productos y marcas (portfolio).
 * GET /dashboard/portfolio?fechaMin=YYYY-MM-DD&fechaMax=YYYY-MM-DD
 */
exports.getPortfolioStats = async (req, res) => {
    try {
        const { defaultFechaMin, defaultFechaMax } = getDefaultDates();
        const fechaMin = req.query.fechaMin || defaultFechaMin;
        const fechaMax = req.query.fechaMax || defaultFechaMax;
        const limit = req.query.limit === 'all' ? 'all' : (parseInt(req.query.limit) || 10);

        const stats = await dashboardService.getPortfolioStats(fechaMin, fechaMax, limit);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener estadísticas de clientes, vendedores y listas de precios (comercial).
 * GET /dashboard/commercial?fechaMin=YYYY-MM-DD&fechaMax=YYYY-MM-DD
 */
exports.getCommercialStats = async (req, res) => {
    try {
        const { defaultFechaMin, defaultFechaMax } = getDefaultDates();
        const fechaMin = req.query.fechaMin || defaultFechaMin;
        const fechaMax = req.query.fechaMax || defaultFechaMax;

        const stats = await dashboardService.getCommercialStats(fechaMin, fechaMax);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
