const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

console.log('Available hooks on sequelize:', Object.keys(sequelize.constructor.prototype).filter(k => k.includes('Hook') || k.includes('hook')));
console.log('sequelize.runHooks:', typeof sequelize.runHooks);

sequelize.addHook('beforeConnect', (config) => {
    console.log('--- beforeConnect hook called!');
});

sequelize.addHook('afterConnect', (connection, config) => {
    console.log('--- afterConnect hook called!');
});

async function run() {
    console.log('Calling authenticate...');
    await sequelize.authenticate();
    console.log('Authenticate done.');
    await sequelize.close();
}

run();
