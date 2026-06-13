const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

const Test = sequelize.define('Test', {
    dateVal: DataTypes.DATE
});

async function run() {
    await sequelize.sync({ force: true });
    
    // Insert using raw queries to see how Sequelize parses different formats
    await sequelize.query("INSERT INTO Tests (dateVal, createdAt, updatedAt) VALUES ('2026-06-11T00:58:17.436Z', datetime('now'), datetime('now'))");
    await sequelize.query("INSERT INTO Tests (dateVal, createdAt, updatedAt) VALUES ('2026-06-11 00:58:17.436 +00:00', datetime('now'), datetime('now'))");
    await sequelize.query("INSERT INTO Tests (dateVal, createdAt, updatedAt) VALUES ('2026-06-11 00:58:17.436', datetime('now'), datetime('now'))");
    
    const records = await Test.findAll();
    records.forEach((r, idx) => {
        console.log(`Format ${idx + 1}: val = ${r.dateVal}, type = ${typeof r.dateVal}, isValid = ${!isNaN(new Date(r.dateVal).getTime())}`);
    });
}

run();
