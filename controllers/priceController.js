const priceService = require('../services/priceService');
const { PriceCreateDto, PriceUpdateDto } = require('../dtos/price/request');
const { PriceResponseDto } = require('../dtos/price/response');

/**
 * Obtener todos los precios asociados a un producto ID.
 * Ruta: GET /prices/product/:productoId
 */
exports.findByProductoId = async (req, res) => {
    try {
        const prices = await priceService.findByProductoId(req.params.productoId);
        res.json(PriceResponseDto.fromModel(prices));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Crear un nuevo registro de precio utilizando PriceCreateDto.
 * Ruta: POST /prices
 */
exports.create = async (req, res) => {
    try {
        const priceDto = new PriceCreateDto(req.body);
        const validation = priceDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const nuevoPrecio = await priceService.create(priceDto);
        res.status(201).json(PriceResponseDto.fromModel(nuevoPrecio));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Actualizar un registro de precio específico por su ID único.
 * Ruta: PUT /prices/:id
 */
exports.update = async (req, res) => {
    try {
        const priceDto = new PriceUpdateDto({ id: req.params.id, ...req.body });
        
        const validation = priceDto.validate();
        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const precioActualizado = await priceService.update(req.params.id, priceDto);
        if (!precioActualizado) {
            return res.status(404).json({ mensaje: 'Registro de precio no encontrado' });
        }

        res.json(PriceResponseDto.fromModel(precioActualizado));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Eliminar un registro de precio específico por su ID.
 * Ruta: DELETE /prices/:id
 */
exports.deletePrice = async (req, res) => {
    try {
        const eliminado = await priceService.deletePrice(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ mensaje: 'Registro de precio no encontrado' });
        }
        res.json({ mensaje: 'Precio eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
