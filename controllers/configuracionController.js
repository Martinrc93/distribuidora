const Configuracion = require('../models/configuracion');

// Get all configurations
exports.getAll = async (req, res) => {
    try {
        const configs = await Configuracion.findAll();
        // Return an object with key-value pairs for easier parsing on the frontend
        const configMap = {};
        configs.forEach(c => {
            configMap[c.clave] = c.valor;
        });
        res.json(configMap);
    } catch (error) {
        console.error('Error al obtener configuraciones:', error);
        res.status(500).json({ error: 'Error al obtener las configuraciones.' });
    }
};

// Update multiple configurations at once
exports.updateBulk = async (req, res) => {
    try {
        const updates = req.body; // Expects an object like { "impresion_nombre_comercio": "Distribuidora XYZ", ... }
        
        for (const [clave, valor] of Object.entries(updates)) {
            // Upsert each config
            const [config, created] = await Configuracion.findOrCreate({
                where: { clave },
                defaults: { valor: String(valor) }
            });
            
            if (!created) {
                config.valor = String(valor);
                await config.save();
            }
        }
        
        res.json({ message: 'Configuraciones actualizadas correctamente.' });
    } catch (error) {
        console.error('Error al actualizar configuraciones:', error);
        res.status(500).json({ error: 'Error al actualizar las configuraciones.' });
    }
};
