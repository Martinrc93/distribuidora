const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

// Let's add hook via addHook
sequelize.addHook('afterConnect', (connection, config) => {
    console.log('--- afterConnect Hook registered via addHook called!');
});

// Let's also check if connectionManager has a way to register or hook
console.log('connectionManager has afterConnect?', typeof sequelize.connectionManager.afterConnect);

async function run() {
    console.log('Running query...');
    await sequelize.query('SELECT 1+1');
    await sequelize.close();
}

run();
