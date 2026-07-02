const clienteService = require('../services/clienteService');
const { ClienteCreateDto, ClienteUpdateDto } = require('../dtos/cliente/request');
const { ClienteResponseDto } = require('../dtos/cliente/response');

/**
 * Obtener todos los clientes con paginación y búsqueda opcional.
 * Ruta: GET /clientes?page=1&limit=10&q=
 */
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, q = '' } = req.query;
        const result = await clienteService.getAll(page, limit, q);
        
        // Mapear los datos de los clientes utilizando el Response DTO
        result.data = ClienteResponseDto.fromModel(result.data);
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener un cliente específico por su ID.
 * Ruta: GET /clientes/:id
 */
exports.getById = async (req, res) => {
    try {
        const cliente = await clienteService.getById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }
        res.json(ClienteResponseDto.fromModel(cliente));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Crear un nuevo cliente.
 * Ruta: POST /clientes
 */
exports.create = async (req, res) => {
    try {
        const clienteDto = new ClienteCreateDto(req.body);
        const validation = clienteDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const nuevoCliente = await clienteService.create(clienteDto);
        res.status(201).json(ClienteResponseDto.fromModel(nuevoCliente));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Actualizar un cliente existente.
 * Ruta: PUT /clientes/:id
 */
exports.update = async (req, res) => {
    try {
        const clienteDto = new ClienteUpdateDto(req.body);
        const validation = clienteDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const clienteActualizado = await clienteService.update(req.params.id, clienteDto);
        if (!clienteActualizado) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado para actualizar' });
        }

        res.json(ClienteResponseDto.fromModel(clienteActualizado));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Eliminar un cliente.
 * Ruta: DELETE /clientes/:id
 */
exports.deleteCliente = async (req, res) => {
    try {
        const eliminado = await clienteService.deleteCliente(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        }
        res.json({ mensaje: 'Cliente eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
