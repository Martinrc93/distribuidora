const empleadoService = require('../services/empleadoService');
const { EmpleadoCreateDto, EmpleadoUpdateDto } = require('../dtos/empleado/request');
const { EmpleadoResponseDto } = require('../dtos/empleado/response');

/**
 * Obtener todos los empleados con paginación y filtro opcional por nombre.
 * Ruta: GET /empleados?page=1&limit=10&nombre=Juan
 */
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, nombre = '' } = req.query;
        
        const result = await empleadoService.getAll(page, limit, nombre);
        
        // Mapear los datos de empleados al Response DTO
        result.data = EmpleadoResponseDto.fromModel(result.data);
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener un empleado por su ID único.
 * Ruta: GET /empleados/:id
 */
exports.getById = async (req, res) => {
    try {
        const empleado = await empleadoService.getById(req.params.id);
        if (!empleado) {
            return res.status(404).json({ mensaje: 'Empleado no encontrado' });
        }
        res.json(EmpleadoResponseDto.fromModel(empleado));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Crear un nuevo empleado utilizando EmpleadoCreateDto.
 * Ruta: POST /empleados
 */
exports.create = async (req, res) => {
    try {
        const empleadoDto = new EmpleadoCreateDto(req.body);
        const validation = empleadoDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const nuevoEmpleado = await empleadoService.create(empleadoDto);
        res.status(201).json(EmpleadoResponseDto.fromModel(nuevoEmpleado));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Actualizar un empleado existente utilizando EmpleadoUpdateDto.
 * Ruta: PUT /empleados/:id o PATCH /empleados/:id
 */
exports.update = async (req, res) => {
    try {
        const empleadoDto = new EmpleadoUpdateDto(req.body);
        const validation = empleadoDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const empleadoActualizado = await empleadoService.update(req.params.id, empleadoDto);
        if (!empleadoActualizado) {
            return res.status(404).json({ mensaje: 'Empleado no encontrado para actualizar' });
        }

        res.json(EmpleadoResponseDto.fromModel(empleadoActualizado));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Eliminar un empleado.
 * Ruta: DELETE /empleados/:id
 */
exports.deleteEmpleado = async (req, res) => {
    try {
        const eliminado = await empleadoService.deleteEmpleado(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ mensaje: 'Empleado no encontrado' });
        }
        res.json({ mensaje: 'Empleado eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
