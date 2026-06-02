const productoService = require('../services/productoService.js');
const ProductCreateDto = require('../dtos/product/request/productCreateDto.js');
const ProductUpdateDto = require('../dtos/product/request/productUpdateDto.js');
const { sequelize, Producto, Price } = require('../models');

/**
 * Obtener todos los productos.
 * Ruta: GET /
 */
exports.getAllProductos = async (req, res) => {
    try {
        const data = await productoService.obtenerTodos();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obtener un producto específico por su ID.
 * Ruta: GET /:id
 */
exports.getProductoById = async (req, res) => {
    try {
        const producto = await productoService.obtenerPorId(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Crear un nuevo producto.
 * Ruta: POST /
 */
exports.createProducto = async (req, res) => {
    try {
        const dto = new ProductCreateDto(req.body);
        const validation = dto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        const nuevoProducto = await sequelize.transaction(async (t) => {
            // 1. Crear el producto
            const producto = await Producto.create({
                nombre: dto.nombre,
                marca: dto.marca,
                costo: dto.costo
            }, { transaction: t });

            // 2. Crear los precios asociados
            await Price.create({
                productId: producto.id,
                precioLista1: dto.precios.lista1,
                precioLista2: dto.precios.lista2,
                precioLista3: dto.precios.lista3,
                precioLista4: dto.precios.lista4,
                precioLista5: dto.precios.lista5,
                precioLista6: dto.precios.lista6,
                precioLista7: dto.precios.lista7
            }, { transaction: t });

            return producto;
        });
        
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Actualizar un producto existente.
 * Ruta: PUT /:id
 */
exports.updateProducto = async (req, res) => {
    try {
        const dto = new ProductUpdateDto(req.body);
        const validation = dto.validate();

        if (!validation.isValid) {
            return res.status(400).json({ errores: validation.errors });
        }

        // Se usa 'dto' directamente porque solo contiene propiedades definidas
        const productoActualizado = await productoService.actualizarProducto(req.params.id, dto);
        if (!productoActualizado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado para actualizar' });
        }
        res.status(200).json(productoActualizado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Eliminar un producto.
 * Ruta: DELETE /:id
 */
exports.deleteProducto = async (req, res) => {
    try {
        const eliminado = await productoService.eliminarProducto(req.params.id);
        if (!eliminado) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.status(200).json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Actualizar el costo y los precios de un producto en una sola transacción.
 * Ruta: PUT /:id/precios
 */
exports.actualizarPrecios = async (req, res) => {
    const { id } = req.params;
    const { costo, precios } = req.body;

    const t = await sequelize.transaction();

    try {
        // a) Buscar el Producto por ID
        const producto = await Producto.findByPk(id, { transaction: t });
        if (!producto) {
            await t.rollback();
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        // Actualizarle su campo costo
        await producto.update({ costo }, { transaction: t });

        // b) Buscar el registro asociado en la tabla Precios usando el productId
        let priceRecord = await Price.findOne({
            where: { productId: id },
            transaction: t
        });

        const precioData = {
            precioLista1: precios.lista1,
            precioLista2: precios.lista2,
            precioLista3: precios.lista3,
            precioLista4: precios.lista4,
            precioLista5: precios.lista5,
            precioLista6: precios.lista6,
            precioLista7: precios.lista7
        };

        if (priceRecord) {
            // Si existe, actualizarlo
            await priceRecord.update(precioData, { transaction: t });
        } else {
            // Si no existía, crearlo
            await Price.create({
                productId: id,
                ...precioData
            }, { transaction: t });
        }

        // Confirmar la transacción (commit)
        await t.commit();

        res.status(200).json({ mensaje: 'Precios y costo actualizados exitosamente' });
    } catch (error) {
        // Revertir transacción si hay error
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};
