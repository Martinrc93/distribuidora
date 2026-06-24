const sequelize = require('../config/db/dataBase.js');
const { deleteProduct } = require('../services/productService.js');

async function run() {
    try {
        console.log('Calling deleteProduct for ID 2...');
        const result = await deleteProduct(2);
        console.log('Result of deleteProduct:', result);
    } catch (e) {
        console.error('Error during delete:', e);
    } finally {
        await sequelize.close();
    }
}
run();
