const fs = require('fs');
const path = require('path');

const productosPath = path.join(__dirname, '../Productos.txt');
const seedSqlPath = path.join(__dirname, '../seed.sql');

// 1. Leer y parsear Productos.txt
const content = fs.readFileSync(productosPath, 'utf8');
const lines = content.split('\n');

const brands = [];
const products = [];

let currentBrandIndex = -1;

for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.startsWith('-')) {
        const productName = line.substring(1).trim();
        if (currentBrandIndex === -1) {
            console.error(`Error: Product without brand: ${line}`);
            continue;
        }
        products.push({
            name: productName,
            brandIndex: currentBrandIndex
        });
    } else {
        brands.push(line);
        currentBrandIndex = brands.length - 1;
    }
}

// 2. Construir las sentencias SQL de Marcas
const marcasSqlValues = brands.map(brand => {
    const escapedBrand = brand.replace(/'/g, "''");
    return `('${escapedBrand}', datetime('now'), datetime('now'))`;
}).join(',\n');

const marcasSql = `INSERT INTO "Marcas" (nombre, createdAt, updatedAt) VALUES\n${marcasSqlValues};`;

// 3. Construir las sentencias SQL de Products
const productsSqlValues = products.map(prod => {
    const escapedName = prod.name.replace(/'/g, "''");
    const marcaId = prod.brandIndex + 1;
    return `('${escapedName}', ${marcaId}, 0.00, datetime('now'), datetime('now'))`;
}).join(',\n');

const productsSql = `INSERT INTO "Products" (nombre, marcaId, costo, createdAt, updatedAt) VALUES\n${productsSqlValues};`;

// 4. Construir las sentencias SQL de Prices y guardar en memoria para asociar en pedidos
const pricesSqlValues = [];
const insertedPrices = []; // Array of { id, productId, listaPreciosId, precio }
let priceIdCounter = 1;

products.forEach((prod, index) => {
    const productId = index + 1;
    const brand = brands[prod.brandIndex];
    
    if (brand === 'Marlboro') {
        pricesSqlValues.push(`(15.00, ${productId}, 1, datetime('now'), datetime('now'))`);
        insertedPrices.push({ id: priceIdCounter++, productId, listaPreciosId: 1, precio: 15.00 });
    } else if (brand === 'Lucky Strike (Lucky)') {
        pricesSqlValues.push(`(20.00, ${productId}, 1, datetime('now'), datetime('now'))`);
        insertedPrices.push({ id: priceIdCounter++, productId, listaPreciosId: 1, precio: 20.00 });
        
        pricesSqlValues.push(`(25.00, ${productId}, 2, datetime('now'), datetime('now'))`);
        insertedPrices.push({ id: priceIdCounter++, productId, listaPreciosId: 2, precio: 25.00 });
        
        pricesSqlValues.push(`(30.00, ${productId}, 3, datetime('now'), datetime('now'))`);
        insertedPrices.push({ id: priceIdCounter++, productId, listaPreciosId: 3, precio: 30.00 });
        
        pricesSqlValues.push(`(35.00, ${productId}, 4, datetime('now'), datetime('now'))`);
        insertedPrices.push({ id: priceIdCounter++, productId, listaPreciosId: 4, precio: 35.00 });
    } else if (brand === 'Red Point') {
        pricesSqlValues.push(`(40.00, ${productId}, 1, datetime('now'), datetime('now'))`);
        insertedPrices.push({ id: priceIdCounter++, productId, listaPreciosId: 1, precio: 40.00 });
        
        pricesSqlValues.push(`(45.00, ${productId}, 2, datetime('now'), datetime('now'))`);
        insertedPrices.push({ id: priceIdCounter++, productId, listaPreciosId: 2, precio: 45.00 });
        
        pricesSqlValues.push(`(50.00, ${productId}, 3, datetime('now'), datetime('now'))`);
        insertedPrices.push({ id: priceIdCounter++, productId, listaPreciosId: 3, precio: 50.00 });
    }
});

let pricesSql = '';
if (pricesSqlValues.length > 0) {
    pricesSql = `INSERT INTO "Prices" (precio, productId, listaPreciosId, createdAt, updatedAt) VALUES\n${pricesSqlValues.join(',\n')};`;
}

// Funciones auxiliares para buscar productos y resolver precios usando fallback
function getProductByName(name) {
    const idx = products.findIndex(p => p.name === name);
    if (idx === -1) throw new Error(`Product not found: ${name}`);
    return {
        id: idx + 1,
        name: products[idx].name,
        brandIndex: products[idx].brandIndex
    };
}

function resolvePriceForProduct(productId, targetListId) {
    const productPrices = insertedPrices.filter(p => p.productId === productId);
    if (productPrices.length === 0) return null;
    
    let priceRecord = productPrices.find(p => p.listaPreciosId === targetListId);
    if (!priceRecord) {
        // Fallback: ordenar descendente por listaPreciosId y tomar el primero
        priceRecord = [...productPrices].sort((a, b) => b.listaPreciosId - a.listaPreciosId)[0];
    }
    return priceRecord;
}

// 5. Construir pedidos (Ventas y Detalles)
const sampleSales = [
    {
        clienteId: 1,
        clientListId: 1,
        empleadoId: 1,
        fecha: "datetime('now', '-2 days')",
        items: [
            { productName: 'MARLBORO 12', cantidad: 5 },
            { productName: 'LUCKY BLANCO 12', cantidad: 4 },
            { productName: 'RED POINT BOX 20', cantidad: 2 }
        ]
    },
    {
        clienteId: 2,
        clientListId: 2,
        empleadoId: 2,
        fecha: "datetime('now', '-1 days')",
        items: [
            { productName: 'MARLBORO 12', cantidad: 2 },
            { productName: 'LUCKY BLANCO 12', cantidad: 4 },
            { productName: 'RED POINT BOX 20', cantidad: 3 }
        ]
    },
    {
        clienteId: 3,
        clientListId: 1,
        empleadoId: 1,
        fecha: "datetime('now')",
        items: [
            { productName: 'MARLBORO BOX 20', cantidad: 10 },
            { productName: 'LUCKY BLANCO BOX 20', cantidad: 10 },
            { productName: 'RED POINT CLICK BOX 20', cantidad: 10 }
        ]
    },
    {
        clienteId: 1,
        clientListId: 1,
        empleadoId: 2,
        fecha: "datetime('now')",
        items: [
            { productName: 'MARLBORO GOLD BOX 20', cantidad: 3 },
            { productName: 'LUCKY ORIGEN RED KS. 20', cantidad: 5 }
        ]
    },
    {
        clienteId: 2,
        clientListId: 2,
        empleadoId: 3,
        fecha: "datetime('now')",
        items: [
            { productName: 'LUCKY ORIGEN RED KS. 20', cantidad: 8 },
            { productName: 'RED POINT MENTOLADO', cantidad: 2 }
        ]
    }
];

const ventasSqlValues = [];
const detallesSqlValues = [];
let sellIdCounter = 1;

sampleSales.forEach(sale => {
    let totalVenta = 0;
    const sellId = sellIdCounter++;
    
    sale.items.forEach(item => {
        const prod = getProductByName(item.productName);
        const priceRecord = resolvePriceForProduct(prod.id, sale.clientListId);
        
        if (!priceRecord) {
            throw new Error(`No price record resolved for product ${item.productName} and list ${sale.clientListId}`);
        }
        
        const subtotal = item.cantidad * priceRecord.precio;
        totalVenta += subtotal;
        
        detallesSqlValues.push(
            `(${sellId}, ${prod.id}, ${priceRecord.id}, ${item.cantidad}, ${priceRecord.precio.toFixed(2)}, datetime('now'), datetime('now'))`
        );
    });
    
    // Con costo = 0, la ganancia es igual al total de la venta
    const ganancia = totalVenta;
    
    ventasSqlValues.push(
        `(${sale.fecha}, ${totalVenta.toFixed(2)}, ${ganancia.toFixed(2)}, 1, ${sale.empleadoId}, ${sale.clienteId}, datetime('now'), datetime('now'))`
    );
});

const ventasSql = `INSERT INTO "Ventas" (fecha_emision, total, ganancia, active, empleadoId, clienteId, createdAt, updatedAt) VALUES\n${ventasSqlValues.join(',\n')};`;
const detallesSql = `INSERT INTO "Detalles" (sellId, productId, priceId, cantidad, precio, createdAt, updatedAt) VALUES\n${detallesSqlValues.join(',\n')};`;

// 6. Armar el contenido final de seed.sql
const finalSeedSql = `-- Archivo SQL para insertar datos semilla en la tabla de usuarios (Users), productos (Products), clientes (Clientes), empleados (Empleados)
-- SQLite utiliza por defecto el nombre en plural generado por Sequelize

INSERT INTO "ListaPrecios" (nombre, createdAt, updatedAt) VALUES
('Lista 1', datetime('now'), datetime('now')),
('Lista 2', datetime('now'), datetime('now')),
('Lista 3', datetime('now'), datetime('now')),
('Lista 4', datetime('now'), datetime('now')),
('Lista 5', datetime('now'), datetime('now')),
('Lista 6', datetime('now'), datetime('now')),
('Lista 7', datetime('now'), datetime('now')),
('Lista 8', datetime('now'), datetime('now'));

INSERT INTO "Users" (nombre, createdAt, updatedAt) VALUES
('Juan Pérez', datetime('now'), datetime('now')),
('María Rodríguez', datetime('now'), datetime('now')),
('Carlos Gómez', datetime('now'), datetime('now')),
('Ana Martínez', datetime('now'), datetime('now')),
('Lucía Fernández', datetime('now'), datetime('now'));

INSERT INTO "Clientes" (nombre, direccion, contacto, listaPreciosId, createdAt, updatedAt) VALUES
('Supermercado Alborada', 'Av. Rivadavia 1234', '11-4567-8901', 1, datetime('now'), datetime('now')),
('MiniMarket Express', 'Calle Corrientes 567', '11-2345-6789', 2, datetime('now'), datetime('now')),
('Almacén de Don Pepe', 'Belgrano 890', '11-9876-5432', 1, datetime('now'), datetime('now'));

${marcasSql}

${productsSql}

${pricesSql ? pricesSql + '\n' : ''}
INSERT INTO "Empleados" (nombre, apellido, active, createdAt, updatedAt) VALUES 
('Martín', 'Gómez', 1, datetime('now'), datetime('now')), 
('Florencia', 'Díaz', 1, datetime('now'), datetime('now')), 
('Roberto', 'Sánchez', 1, datetime('now'), datetime('now'));

${ventasSql}

${detallesSql}
`;

fs.writeFileSync(seedSqlPath, finalSeedSql, 'utf8');
console.log('¡seed.sql ha sido regenerado exitosamente con pedidos semilla!');
