const productService = require('../services/productService');
const { ProductCreateDto } = require('../dtos/product/request');
const { ProductResponseDto } = require('../dtos/product/response');

/**
 * Obtener todos los productos con paginación opcional.
 * Ruta: GET /products?page=1&limit=10
 */
exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, q = '' } = req.query;
        const result = await productService.getAll(page, limit, q);
        
        // Mapear los datos de los productos utilizando el Response DTO
        result.data = ProductResponseDto.fromModel(result.data);
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener todos los productos sin paginación.
 * Ruta: GET /products/all
 */
exports.getAllWithoutPagination = async (req, res) => {
    try {
        const productos = await productService.getAllWithoutPagination();
        res.json(ProductResponseDto.fromModel(productos));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Obtener un producto específico por su ID.
 * Ruta: GET /products/:id
 */
exports.getById = async (req, res) => {
    try {
        const producto = await productService.getById(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.json(ProductResponseDto.fromModel(producto));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Crear un nuevo producto utilizando ProductCreateDto (CreateProductRequest).
 * Ruta: POST /products
 */
exports.create = async (req, res) => {
    try {
        const productDto = new ProductCreateDto(req.body);
        const validation = productDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const nuevoProducto = await productService.create(productDto);
        res.status(201).json(ProductResponseDto.fromModel(nuevoProducto));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Actualizar un producto existente utilizando ProductCreateDto para reemplazo completo.
 * Ruta: PUT /products/:id
 */
exports.update = async (req, res) => {
    try {
        const productDto = new ProductCreateDto(req.body);
        const validation = productDto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const productoActualizado = await productService.update(req.params.id, productDto);
        if (!productoActualizado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado para actualizar' });
        }

        res.json(ProductResponseDto.fromModel(productoActualizado));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Eliminar un producto.
 * Ruta: DELETE /products/:id
 */
exports.deleteProduct = async (req, res) => {
    try {
        const eliminado = await productService.deleteProduct(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
