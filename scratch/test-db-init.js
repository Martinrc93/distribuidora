const sequelize = require('../config/db/dataBase.js');

async function run() {
    try {
        console.log('Querying journal_mode...');
        const [res] = await sequelize.query('PRAGMA journal_mode;');
        console.log('Journal mode:', res);

        console.log('Querying busy_timeout...');
        const [timeout] = await sequelize.query('PRAGMA busy_timeout;');
        console.log('Busy timeout:', timeout);

        console.log('Querying foreign_keys...');
        const fk = await sequelize.query('PRAGMA foreign_keys;');
        console.log('Foreign keys:', fk);
    } catch (e) {
        console.error('Error during test-db-init:', e);
    } finally {
        await sequelize.close();
    }
}
run();
