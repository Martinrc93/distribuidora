const marcaService = require('../services/marcaService');
const { MarcaCreateDto } = require('../dtos/marca/request');
const { MarcaResponseDto } = require('../dtos/marca/response');

/**
 * Obtener todas las marcas con paginación y filtro opcional por nombre.
 * Ruta: GET /marcas?page=1&limit=10&nombre=Bimbo
 */
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, nombre = '' } = req.query;
        
        const result = await marcaService.getAll(page, limit, nombre);
        
        // Mapear los datos de marcas al Response DTO
        result.data = MarcaResponseDto.fromModel(result.data);
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener una marca por su ID único.
 * Ruta: GET /marcas/:id
 */
exports.getById = async (req, res) => {
    try {
        const marca = await marcaService.getById(req.params.id);
        if (!marca) {
            return res.status(404).json({ mensaje: 'Marca no encontrada' });
        }
        res.json(MarcaResponseDto.fromModel(marca));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Crear una nueva marca utilizando MarcaCreateDto.
 * Ruta: POST /marcas
 */
exports.create = async (req, res) => {
    try {
        const marcaDto = new MarcaCreateDto(req.body);
        const validation = marcaDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const nuevaMarca = await marcaService.create(marcaDto);
        res.status(201).json(MarcaResponseDto.fromModel(nuevaMarca));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Actualizar una marca existente utilizando MarcaCreateDto.
 * Ruta: PUT /marcas/:id
 */
exports.update = async (req, res) => {
    try {
        const marcaDto = new MarcaCreateDto(req.body);
        const validation = marcaDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const marcaActualizada = await marcaService.update(req.params.id, marcaDto);
        if (!marcaActualizada) {
            return res.status(404).json({ mensaje: 'Marca no encontrada para actualizar' });
        }

        res.json(MarcaResponseDto.fromModel(marcaActualizada));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Eliminar una marca.
 * Ruta: DELETE /marcas/:id
 */
exports.deleteMarca = async (req, res) => {
    try {
        const eliminado = await marcaService.deleteMarca(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ mensaje: 'Marca no encontrada' });
        }
        res.json({ mensaje: 'Marca eliminada exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener todas las marcas sin paginación.
 * Ruta: GET /marcas/all
 */
exports.getAllWithoutPagination = async (req, res) => {
    try {
        const marcas = await marcaService.getAllWithoutPagination();
        res.json(MarcaResponseDto.fromModel(marcas));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
