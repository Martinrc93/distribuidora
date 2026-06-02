const empleadoService = require('../services/empleadoService.js');
const { toEmpleadoInputDTO } = require('../dtos/empleadoDto.js');

/**
 * Obtener todos los empleados.
 * Ruta: GET /
 */
const getAllEmpleados = async (req, res) => {
    try {
        const data = await empleadoService.obtenerTodos();
        // Nos aseguramos de devolver siempre un array válido, incluso si data es null o undefined
        res.status(200).json(data || []);
    } catch (err) {
        console.error('Error detallado:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Crear un nuevo empleado.
 * Ruta: POST /
 */
const createEmpleado = async (req, res) => {
    try {
        const { nombreCompleto } = req.body;

        // Validación superficial HTTP
        if (!nombreCompleto || typeof nombreCompleto !== 'string' || nombreCompleto.trim() === '') {
            return res.status(400).json({ error: 'El nombre completo es obligatorio.' });
        }

        const datosSanitizados = toEmpleadoInputDTO(req.body);
        const nuevoEmpleado = await empleadoService.crearEmpleado(datosSanitizados);
        
        res.status(201).json(nuevoEmpleado);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getAllEmpleados,
    createEmpleado
};
