-- Archivo SQL para insertar datos semilla en la tabla de usuarios (Users) y productos (Products)
-- SQLite utiliza por defecto el nombre en plural generado por Sequelize

INSERT INTO "Users" (nombre, createdAt, updatedAt) VALUES
('Juan Pérez', datetime('now'), datetime('now')),
('María Rodríguez', datetime('now'), datetime('now')),
('Carlos Gómez', datetime('now'), datetime('now')),
('Ana Martínez', datetime('now'), datetime('now')),
('Lucía Fernández', datetime('now'), datetime('now'));

INSERT INTO "Productos" (nombre, marca, costo, createdAt, updatedAt) VALUES
('Leche Entera 1L', 'La Serenísima', 1.00, datetime('now'), datetime('now')),
('Pan Lactal Familiar', 'Bimbo', 1.60, datetime('now'), datetime('now')),
('Gaseosa Cola 2.25L', 'Coca-Cola', 2.20, datetime('now'), datetime('now')),
('Arroz Integral 1kg', 'Gallo', 1.30, datetime('now'), datetime('now')),
('Aceite de Girasol 1.5L', 'Natura', 3.40, datetime('now'), datetime('now')),
('Fideos Tallarines 500g', 'Lucchetti', 0.80, datetime('now'), datetime('now')),
('Café Molido 500g', 'Cabrales', 4.80, datetime('now'), datetime('now')),
('Azúcar Común 1kg', 'Ledesma', 0.65, datetime('now'), datetime('now')),
('Yerba Mate 1kg', 'Playadito', 3.80, datetime('now'), datetime('now')),
('Galletitas de Chocolate', 'Chocolinas', 1.25, datetime('now'), datetime('now'));

INSERT INTO "Empleados" ("nombreCompleto", "activo", "createdAt", "updatedAt") VALUES ('Martín Gómez', 1, datetime('now'), datetime('now')), ('Florencia Díaz', 1, datetime('now'), datetime('now')), ('Roberto Sánchez', 1, datetime('now'), datetime('now'));

INSERT INTO "Prices" (precioLista1, precioLista2, precioLista3, precioLista4, precioLista5, precioLista6, precioLista7, productId, createdAt, updatedAt) VALUES
-- Producto 1 (Leche Entera 1L)
(1.10, 1.20, 1.30, 1.40, 1.50, 1.60, 1.70, 1, datetime('now'), datetime('now')),

-- Producto 2 (Pan Lactal Familiar)
(1.90, 2.00, 2.10, 2.20, 2.30, 2.40, 2.50, 2, datetime('now'), datetime('now')),

-- Producto 3 (Gaseosa Cola 2.25L)
(2.60, 2.70, 2.80, 2.90, 3.00, 3.10, 3.20, 3, datetime('now'), datetime('now')),

-- Producto 4 (Arroz Integral 1kg)
(1.40, 1.50, 1.60, 1.70, 1.80, 1.90, 2.00, 4, datetime('now'), datetime('now')),

-- Producto 5 (Aceite de Girasol 1.5L)
(4.10, 4.20, 4.30, 4.40, 4.50, 4.60, 4.70, 5, datetime('now'), datetime('now')),

-- Producto 6 (Fideos Tallarines 500g)
(0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 6, datetime('now'), datetime('now')),

-- Producto 7 (Café Molido 500g)
(5.80, 5.90, 6.00, 6.10, 6.20, 6.30, 6.40, 7, datetime('now'), datetime('now')),

-- Producto 8 (Azúcar Común 1kg)
(0.75, 0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 8, datetime('now'), datetime('now')),

-- Producto 9 (Yerba Mate 1kg)
(4.60, 4.70, 4.80, 4.90, 5.00, 5.10, 5.20, 9, datetime('now'), datetime('now')),

-- Producto 10 (Galletitas de Chocolate)
(1.50, 1.55, 1.60, 1.70, 1.75, 1.80, 1.85, 10, datetime('now'), datetime('now'));
