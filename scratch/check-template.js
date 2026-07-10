const { Sequelize } = require('sequelize');
const path = require('path');

async function checkTemplate() {
    const templatePath = path.resolve(__dirname, '../database.template.sqlite');
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: templatePath,
        logging: false
    });
    
    try {
        const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables in template:', tables.map(t => t.name));
        
        const [salesCount] = await sequelize.query("SELECT COUNT(*) as count FROM Ventas");
        console.log('Ventas count in template:', salesCount[0].count);
        
        if (salesCount[0].count > 0) {
            const [sales] = await sequelize.query("SELECT id, fecha_emision FROM Ventas LIMIT 5");
            console.log('Sample sales in template:', sales);
        }
    } catch (e) {
        console.error('Error checking template:', e.message);
    } finally {
        await sequelize.close();
    }
}

checkTemplate();
