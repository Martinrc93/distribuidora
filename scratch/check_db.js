const sequelize = require('../config/db/dataBase.js');
const Product = require('../models/product.js');
const Marca = require('../models/marca.js');
const Price = require('../models/price.js');
const Venta = require('../models/venta.js');
const Detalle = require('../models/detalle.js');
const Cliente = require('../models/cliente.js');

async function check() {
  try {
    const brandCount = await Marca.count();
    const productCount = await Product.count();
    const priceCount = await Price.count();
    const ventaCount = await Venta.count();
    const detalleCount = await Detalle.count();
    
    console.log(`Marcas in DB: ${brandCount}`);
    console.log(`Products in DB: ${productCount}`);
    console.log(`Prices in DB: ${priceCount}`);
    console.log(`Ventas in DB: ${ventaCount}`);
    console.log(`Detalles in DB: ${detalleCount}`);
    
    const sales = await Venta.findAll({
      include: [
        { model: Cliente, as: 'cliente' },
        { 
          model: Detalle, 
          as: 'detalles',
          include: [{ model: Product, as: 'producto' }]
        }
      ]
    });
    
    sales.forEach(sale => {
      console.log(`\nVenta ID ${sale.id} - Cliente: ${sale.cliente.nombre} - Total: $${sale.total} - Ganancia: $${sale.ganancia}`);
      sale.detalles.forEach(d => {
        console.log(`  - ${d.producto.nombre} | Cantidad: ${d.cantidad} | Precio Unitario: $${d.precio}`);
      });
    });

  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await sequelize.close();
  }
}

check();
