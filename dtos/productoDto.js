/**
 * DTO para la creación y manipulación de un Producto.
 * Filtra y sanitiza los datos, aislando el esquema de la base de datos
 * de la forma en que el front-end envía o recibe los datos.
 */

const toProductoInputDTO = (data) => {
    return {
        marca: typeof data.marca === 'string' ? data.marca.trim() : null,
        costo: data.costo !== undefined ? parseFloat(data.costo) : 0,
        precioLista1: data.precioLista1 !== undefined ? parseFloat(data.precioLista1) : 0,
        precioLista2: data.precioLista2 !== undefined ? parseFloat(data.precioLista2) : 0,
        precioLista3: data.precioLista3 !== undefined ? parseFloat(data.precioLista3) : 0,
        precioLista4: data.precioLista4 !== undefined ? parseFloat(data.precioLista4) : 0,
        precioLista5: data.precioLista5 !== undefined ? parseFloat(data.precioLista5) : 0,
        precioLista6: data.precioLista6 !== undefined ? parseFloat(data.precioLista6) : 0,
        precioLista7: data.precioLista7 !== undefined ? parseFloat(data.precioLista7) : 0
    };
};

const toProductoOutputDTO = (productoRaw) => {
    // Extraemos los valores crudos para evitar metadatos del ORM
    const producto = productoRaw.toJSON ? productoRaw.toJSON() : productoRaw;

    return {
        id: producto.id,
        marca: producto.marca,
        costo: parseFloat(producto.costo),
        precios: {
            lista1: parseFloat(producto.precioLista1),
            lista2: parseFloat(producto.precioLista2),
            lista3: parseFloat(producto.precioLista3),
            lista4: parseFloat(producto.precioLista4),
            lista5: parseFloat(producto.precioLista5),
            lista6: parseFloat(producto.precioLista6),
            lista7: parseFloat(producto.precioLista7)
        }
    };
};

module.exports = {
    toProductoInputDTO,
    toProductoOutputDTO
};