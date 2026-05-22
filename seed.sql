-- Archivo SQL para insertar datos semilla en la tabla de usuarios (Users) y productos (Products)
-- SQLite utiliza por defecto el nombre en plural generado por Sequelize

INSERT INTO "Users" (nombre, createdAt, updatedAt) VALUES
('Juan Pérez', datetime('now'), datetime('now')),
('María Rodríguez', datetime('now'), datetime('now')),
('Carlos Gómez', datetime('now'), datetime('now')),
('Ana Martínez', datetime('now'), datetime('now')),
('Lucía Fernández', datetime('now'), datetime('now'));

INSERT INTO "Products" (nombre, marca, createdAt, updatedAt) VALUES
('Leche Entera 1L', 'La Serenísima', datetime('now'), datetime('now')),
('Pan Lactal Familiar', 'Bimbo', datetime('now'), datetime('now')),
('Gaseosa Cola 2.25L', 'Coca-Cola', datetime('now'), datetime('now')),
('Arroz Integral 1kg', 'Gallo', datetime('now'), datetime('now')),
('Aceite de Girasol 1.5L', 'Natura', datetime('now'), datetime('now')),
('Fideos Tallarines 500g', 'Lucchetti', datetime('now'), datetime('now')),
('Café Molido 500g', 'Cabrales', datetime('now'), datetime('now')),
('Azúcar Común 1kg', 'Ledesma', datetime('now'), datetime('now')),
('Yerba Mate 1kg', 'Playadito', datetime('now'), datetime('now')),
('Galletitas de Chocolate', 'Chocolinas', datetime('now'), datetime('now'));
