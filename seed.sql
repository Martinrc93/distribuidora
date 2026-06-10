-- Archivo SQL para insertar datos semilla en la tabla de usuarios (Users) y productos (Products)
-- SQLite utiliza por defecto el nombre en plural generado por Sequelize

INSERT INTO "Users" (nombre, createdAt, updatedAt) VALUES
('Juan Pérez', datetime('now'), datetime('now')),
('María Rodríguez', datetime('now'), datetime('now')),
('Carlos Gómez', datetime('now'), datetime('now')),
('Ana Martínez', datetime('now'), datetime('now')),
('Lucía Fernández', datetime('now'), datetime('now'));

INSERT INTO "Clientes" (nombre, direccion, createdAt, updatedAt) VALUES
('Supermercado Alborada', 'Av. Rivadavia 1234', datetime('now'), datetime('now')),
('MiniMarket Express', 'Calle Corrientes 567', datetime('now'), datetime('now')),
('Almacén de Don Pepe', 'Belgrano 890', datetime('now'), datetime('now'));

INSERT INTO "Products" (nombre, marca, costo, createdAt, updatedAt) VALUES
('Leche Entera 1L', 'La Serenísima', 1.00, datetime('now'), datetime('now')),
('Pan Lactal Familiar', 'Bimbo', 1.60, datetime('now'), datetime('now')),
('Gaseosa Cola 2.25L', 'Coca-Cola', 2.10, datetime('now'), datetime('now')),
('Arroz Integral 1kg', 'Gallo', 1.20, datetime('now'), datetime('now')),
('Aceite de Girasol 1.5L', 'Natura', 3.10, datetime('now'), datetime('now')),
('Fideos Tallarines 500g', 'Lucchetti', 0.70, datetime('now'), datetime('now')),
('Café Molido 500g', 'Cabrales', 4.30, datetime('now'), datetime('now')),
('Azúcar Común 1kg', 'Ledesma', 0.60, datetime('now'), datetime('now')),
('Yerba Mate 1kg', 'Playadito', 3.50, datetime('now'), datetime('now')),
('Galletitas de Chocolate', 'Chocolinas', 1.20, datetime('now'), datetime('now'));

INSERT INTO "Empleados" (nombre, apellido, createdAt, updatedAt) VALUES
('Martín', 'Gómez', datetime('now'), datetime('now')),
('Florencia', 'Díaz', datetime('now'), datetime('now')),
('Roberto', 'Sánchez', datetime('now'), datetime('now'));

INSERT INTO "Prices" (precio, productId, createdAt, updatedAt) VALUES
-- Producto 1 (Leche Entera 1L)
(1.10, 1, datetime('now', '-4 days'), datetime('now', '-4 days')),
(1.20, 1, datetime('now', '-3 days'), datetime('now', '-3 days')),
(1.30, 1, datetime('now', '-2 days'), datetime('now', '-2 days')),
(1.40, 1, datetime('now', '-1 days'), datetime('now', '-1 days')),
(1.50, 1, datetime('now'), datetime('now')),

-- Producto 2 (Pan Lactal Familiar)
(1.90, 2, datetime('now', '-4 days'), datetime('now', '-4 days')),
(2.00, 2, datetime('now', '-3 days'), datetime('now', '-3 days')),
(2.10, 2, datetime('now', '-2 days'), datetime('now', '-2 days')),
(2.20, 2, datetime('now', '-1 days'), datetime('now', '-1 days')),
(2.30, 2, datetime('now'), datetime('now')),

-- Producto 3 (Gaseosa Cola 2.25L)
(2.60, 3, datetime('now', '-4 days'), datetime('now', '-4 days')),
(2.70, 3, datetime('now', '-3 days'), datetime('now', '-3 days')),
(2.80, 3, datetime('now', '-2 days'), datetime('now', '-2 days')),
(2.90, 3, datetime('now', '-1 days'), datetime('now', '-1 days')),
(3.00, 3, datetime('now'), datetime('now')),

-- Producto 4 (Arroz Integral 1kg)
(1.40, 4, datetime('now', '-4 days'), datetime('now', '-4 days')),
(1.50, 4, datetime('now', '-3 days'), datetime('now', '-3 days')),
(1.60, 4, datetime('now', '-2 days'), datetime('now', '-2 days')),
(1.70, 4, datetime('now', '-1 days'), datetime('now', '-1 days')),
(1.80, 4, datetime('now'), datetime('now')),

-- Producto 5 (Aceite de Girasol 1.5L)
(4.10, 5, datetime('now', '-4 days'), datetime('now', '-4 days')),
(4.20, 5, datetime('now', '-3 days'), datetime('now', '-3 days')),
(4.30, 5, datetime('now', '-2 days'), datetime('now', '-2 days')),
(4.40, 5, datetime('now', '-1 days'), datetime('now', '-1 days')),
(4.50, 5, datetime('now'), datetime('now')),

-- Producto 6 (Fideos Tallarines 500g)
(0.90, 6, datetime('now', '-4 days'), datetime('now', '-4 days')),
(0.95, 6, datetime('now', '-3 days'), datetime('now', '-3 days')),
(1.00, 6, datetime('now', '-2 days'), datetime('now', '-2 days')),
(1.05, 6, datetime('now', '-1 days'), datetime('now', '-1 days')),
(1.10, 6, datetime('now'), datetime('now')),

-- Producto 7 (Café Molido 500g)
(5.80, 7, datetime('now', '-4 days'), datetime('now', '-4 days')),
(5.90, 7, datetime('now', '-3 days'), datetime('now', '-3 days')),
(6.00, 7, datetime('now', '-2 days'), datetime('now', '-2 days')),
(6.10, 7, datetime('now', '-1 days'), datetime('now', '-1 days')),
(6.20, 7, datetime('now'), datetime('now')),

-- Producto 8 (Azúcar Común 1kg)
(0.75, 8, datetime('now', '-4 days'), datetime('now', '-4 days')),
(0.80, 8, datetime('now', '-3 days'), datetime('now', '-3 days')),
(0.85, 8, datetime('now', '-2 days'), datetime('now', '-2 days')),
(0.90, 8, datetime('now', '-1 days'), datetime('now', '-1 days')),
(0.95, 8, datetime('now'), datetime('now')),

-- Producto 9 (Yerba Mate 1kg)
(4.60, 9, datetime('now', '-4 days'), datetime('now', '-4 days')),
(4.70, 9, datetime('now', '-3 days'), datetime('now', '-3 days')),
(4.80, 9, datetime('now', '-2 days'), datetime('now', '-2 days')),
(4.90, 9, datetime('now', '-1 days'), datetime('now', '-1 days')),
(5.00, 9, datetime('now'), datetime('now')),

-- Producto 10 (Galletitas de Chocolate)
(1.50, 10, datetime('now', '-4 days'), datetime('now', '-4 days')),
(1.55, 10, datetime('now', '-3 days'), datetime('now', '-3 days')),
(1.60, 10, datetime('now', '-2 days'), datetime('now', '-2 days')),
(1.70, 10, datetime('now', '-1 days'), datetime('now', '-1 days')),
(1.75, 10, datetime('now'), datetime('now'));

INSERT INTO "Ventas" (fecha_emision, total, ganancia, active, empleadoId, clienteId, createdAt, updatedAt) VALUES
(datetime('now', '-2 days'), 23.50, 5.50, 1, 1, 1, datetime('now'), datetime('now')),
(datetime('now', '-1 days'), 40.20, 11.40, 1, 2, 2, datetime('now'), datetime('now')),
(datetime('now'), 18.00, 5.60, 1, 1, 3, datetime('now'), datetime('now')),
(datetime('now'), 18.20, 5.80, 1, 2, 1, datetime('now'), datetime('now')),
(datetime('now'), 30.00, 9.00, 1, 2, 2, datetime('now'), datetime('now')),
(datetime('now'), 18.00, 5.80, 1, 2, 3, datetime('now'), datetime('now')),
(datetime('now'), 22.00, 8.00, 1, 2, 1, datetime('now'), datetime('now'));

INSERT INTO "Detalles" (sellId, productId, priceId, cantidad, precio, createdAt, updatedAt) VALUES
(1, 1, 3, 10, 1.30, datetime('now'), datetime('now')),
(1, 2, 8, 5, 2.10, datetime('now'), datetime('now')),
(2, 3, 14, 8, 2.90, datetime('now'), datetime('now')),
(2, 4, 19, 10, 1.70, datetime('now'), datetime('now')),
(3, 5, 25, 4, 4.50, datetime('now'), datetime('now')),
(4, 1, 5, 6, 1.50, datetime('now'), datetime('now')),
(4, 2, 10, 4, 2.30, datetime('now'), datetime('now')),
(5, 3, 15, 10, 3.00, datetime('now'), datetime('now')),
(6, 4, 20, 5, 1.80, datetime('now'), datetime('now')),
(6, 5, 25, 2, 4.50, datetime('now'), datetime('now')),
(7, 6, 30, 20, 1.10, datetime('now'), datetime('now'));

