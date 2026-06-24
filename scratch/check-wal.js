const sequelize = require('../config/db/dataBase.js');

async function run() {
    try {
        const [res] = await sequelize.query('PRAGMA journal_mode;');
        console.log('Current journal mode:', res);
        
        const [timeout] = await sequelize.query('PRAGMA busy_timeout;');
        console.log('Current busy timeout:', timeout);

        const [fk] = await sequelize.query('PRAGMA foreign_keys;');
        console.log('Current foreign keys:', fk);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
run();
