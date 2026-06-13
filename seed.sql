-- Archivo SQL para insertar datos semilla en la tabla de usuarios (Users), productos (Products), clientes (Clientes), empleados (Empleados), precios (Prices), ventas (Ventas) y detalles (Detalles)
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

INSERT INTO "Clientes" (nombre, direccion, listaPreciosId, createdAt, updatedAt) VALUES
('Supermercado Alborada', 'Av. Rivadavia 1234', 1, datetime('now'), datetime('now')),
('MiniMarket Express', 'Calle Corrientes 567', 2, datetime('now'), datetime('now')),
('Almacén de Don Pepe', 'Belgrano 890', 1, datetime('now'), datetime('now'));

INSERT INTO "Marcas" (nombre, createdAt, updatedAt) VALUES
('La Serenísima', datetime('now'), datetime('now')),
('Bimbo', datetime('now'), datetime('now')),
('Coca-Cola', datetime('now'), datetime('now')),
('Gallo', datetime('now'), datetime('now')),
('Natura', datetime('now'), datetime('now')),
('Lucchetti', datetime('now'), datetime('now')),
('Cabrales', datetime('now'), datetime('now')),
('Ledesma', datetime('now'), datetime('now')),
('Playadito', datetime('now'), datetime('now')),
('Chocolinas', datetime('now'), datetime('now'));

INSERT INTO "Products" (nombre, marcaId, costo, createdAt, updatedAt) VALUES
('Leche Entera 1L', 1, 1.00, datetime('now'), datetime('now')),
('Pan Lactal Familiar', 2, 1.60, datetime('now'), datetime('now')),
('Gaseosa Cola 2.25L', 3, 2.20, datetime('now'), datetime('now')),
('Arroz Integral 1kg', 4, 1.30, datetime('now'), datetime('now')),
('Aceite de Girasol 1.5L', 5, 3.40, datetime('now'), datetime('now')),
('Fideos Tallarines 500g', 6, 0.80, datetime('now'), datetime('now')),
('Café Molido 500g', 7, 4.80, datetime('now'), datetime('now')),
('Azúcar Común 1kg', 8, 0.65, datetime('now'), datetime('now')),
('Yerba Mate 1kg', 9, 3.80, datetime('now'), datetime('now')),
('Galletitas de Chocolate', 10, 1.25, datetime('now'), datetime('now'));

INSERT INTO "Empleados" (nombre, apellido, active, createdAt, updatedAt) VALUES 
('Martín', 'Gómez', 1, datetime('now'), datetime('now')), 
('Florencia', 'Díaz', 1, datetime('now'), datetime('now')), 
('Roberto', 'Sánchez', 1, datetime('now'), datetime('now'));

INSERT INTO "Prices" (precio, productId, listaPreciosId, createdAt, updatedAt) VALUES
-- Producto 1 (Leche Entera 1L) -> IDs 1-8
(1.10, 1, 1, datetime('now'), datetime('now')),
(1.20, 1, 2, datetime('now'), datetime('now')),
(1.30, 1, 3, datetime('now'), datetime('now')),
(1.40, 1, 4, datetime('now'), datetime('now')),
(1.50, 1, 5, datetime('now'), datetime('now')),
(1.60, 1, 6, datetime('now'), datetime('now')),
(1.70, 1, 7, datetime('now'), datetime('now')),
(1.80, 1, 8, datetime('now'), datetime('now')),

-- Producto 2 (Pan Lactal Familiar) -> IDs 9-16
(1.90, 2, 1, datetime('now'), datetime('now')),
(2.00, 2, 2, datetime('now'), datetime('now')),
(2.10, 2, 3, datetime('now'), datetime('now')),
(2.20, 2, 4, datetime('now'), datetime('now')),
(2.30, 2, 5, datetime('now'), datetime('now')),
(2.40, 2, 6, datetime('now'), datetime('now')),
(2.50, 2, 7, datetime('now'), datetime('now')),
(2.60, 2, 8, datetime('now'), datetime('now')),

-- Producto 3 (Gaseosa Cola 2.25L) -> IDs 17-24
(2.60, 3, 1, datetime('now'), datetime('now')),
(2.70, 3, 2, datetime('now'), datetime('now')),
(2.80, 3, 3, datetime('now'), datetime('now')),
(2.90, 3, 4, datetime('now'), datetime('now')),
(3.00, 3, 5, datetime('now'), datetime('now')),
(3.10, 3, 6, datetime('now'), datetime('now')),
(3.20, 3, 7, datetime('now'), datetime('now')),
(3.30, 3, 8, datetime('now'), datetime('now')),

-- Producto 4 (Arroz Integral 1kg) -> IDs 25-32
(1.40, 4, 1, datetime('now'), datetime('now')),
(1.50, 4, 2, datetime('now'), datetime('now')),
(1.60, 4, 3, datetime('now'), datetime('now')),
(1.70, 4, 4, datetime('now'), datetime('now')),
(1.80, 4, 5, datetime('now'), datetime('now')),
(1.90, 4, 6, datetime('now'), datetime('now')),
(2.00, 4, 7, datetime('now'), datetime('now')),
(2.10, 4, 8, datetime('now'), datetime('now')),

-- Producto 5 (Aceite de Girasol 1.5L) -> IDs 33-40
(4.10, 5, 1, datetime('now'), datetime('now')),
(4.20, 5, 2, datetime('now'), datetime('now')),
(4.30, 5, 3, datetime('now'), datetime('now')),
(4.40, 5, 4, datetime('now'), datetime('now')),
(4.50, 5, 5, datetime('now'), datetime('now')),
(4.60, 5, 6, datetime('now'), datetime('now')),
(4.70, 5, 7, datetime('now'), datetime('now')),
(4.80, 5, 8, datetime('now'), datetime('now')),

-- Producto 6 (Fideos Tallarines 500g) -> IDs 41-48
(0.90, 6, 1, datetime('now'), datetime('now')),
(0.95, 6, 2, datetime('now'), datetime('now')),
(1.00, 6, 3, datetime('now'), datetime('now')),
(1.05, 6, 4, datetime('now'), datetime('now')),
(1.10, 6, 5, datetime('now'), datetime('now')),
(1.15, 6, 6, datetime('now'), datetime('now')),
(1.20, 6, 7, datetime('now'), datetime('now')),
(1.25, 6, 8, datetime('now'), datetime('now')),

-- Producto 7 (Café Molido 500g) -> IDs 49-56
(5.80, 7, 1, datetime('now'), datetime('now')),
(5.90, 7, 2, datetime('now'), datetime('now')),
(6.00, 7, 3, datetime('now'), datetime('now')),
(6.10, 7, 4, datetime('now'), datetime('now')),
(6.20, 7, 5, datetime('now'), datetime('now')),
(6.30, 7, 6, datetime('now'), datetime('now')),
(6.40, 7, 7, datetime('now'), datetime('now')),
(6.50, 7, 8, datetime('now'), datetime('now')),

-- Producto 8 (Azúcar Común 1kg) -> IDs 57-64
(0.75, 8, 1, datetime('now'), datetime('now')),
(0.80, 8, 2, datetime('now'), datetime('now')),
(0.85, 8, 3, datetime('now'), datetime('now')),
(0.90, 8, 4, datetime('now'), datetime('now')),
(0.95, 8, 5, datetime('now'), datetime('now')),
(1.00, 8, 6, datetime('now'), datetime('now')),
(1.05, 8, 7, datetime('now'), datetime('now')),
(1.10, 8, 8, datetime('now'), datetime('now')),

-- Producto 9 (Yerba Mate 1kg) -> IDs 65-72
(4.60, 9, 1, datetime('now'), datetime('now')),
(4.70, 9, 2, datetime('now'), datetime('now')),
(4.80, 9, 3, datetime('now'), datetime('now')),
(4.90, 9, 4, datetime('now'), datetime('now')),
(5.00, 9, 5, datetime('now'), datetime('now')),
(5.10, 9, 6, datetime('now'), datetime('now')),
(5.20, 9, 7, datetime('now'), datetime('now')),
(5.30, 9, 8, datetime('now'), datetime('now')),

-- Producto 10 (Galletitas de Chocolate) -> IDs 73-80
(1.50, 10, 1, datetime('now'), datetime('now')),
(1.55, 10, 2, datetime('now'), datetime('now')),
(1.60, 10, 3, datetime('now'), datetime('now')),
(1.70, 10, 4, datetime('now'), datetime('now')),
(1.75, 10, 5, datetime('now'), datetime('now')),
(1.80, 10, 6, datetime('now'), datetime('now')),
(1.85, 10, 7, datetime('now'), datetime('now')),
(1.90, 10, 8, datetime('now'), datetime('now'));

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
(1, 2, 11, 5, 2.10, datetime('now'), datetime('now')),
(2, 3, 20, 8, 2.90, datetime('now'), datetime('now')),
(2, 4, 28, 10, 1.70, datetime('now'), datetime('now')),
(3, 5, 37, 4, 4.50, datetime('now'), datetime('now')),
(4, 1, 5, 6, 1.50, datetime('now'), datetime('now')),
(4, 2, 13, 4, 2.30, datetime('now'), datetime('now')),
(5, 3, 21, 10, 3.00, datetime('now'), datetime('now')),
(6, 4, 29, 5, 1.80, datetime('now'), datetime('now')),
(6, 5, 37, 2, 4.50, datetime('now'), datetime('now')),
(7, 6, 45, 20, 1.10, datetime('now'), datetime('now'));
