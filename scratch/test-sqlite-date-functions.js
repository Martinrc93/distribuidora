const sequelizeModule = require('sequelize');
const { Sequelize } = sequelizeModule;

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

async function run() {
    const [res1] = await sequelize.query("SELECT date('2026-07-10 22:00:00.000 -03:00') as d");
    console.log("date('2026-07-10 22:00:00.000 -03:00') ->", res1[0].d);

    const [res2] = await sequelize.query("SELECT date('2026-07-10 22:00:00.000 -03:00', 'localtime') as d");
    console.log("date('2026-07-10 22:00:00.000 -03:00', 'localtime') ->", res2[0].d);

    await sequelize.close();
}

run();
