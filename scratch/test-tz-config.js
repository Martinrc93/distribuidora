const { Sequelize, DataTypes } = require('sequelize');

function getLocalTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    const sign = offset <= 0 ? '+' : '-';
    return `${sign}${hours}:${minutes}`;
}

const tz = getLocalTimezoneOffset();
console.log('Detected local timezone:', tz);

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: true, // Let's see the SQL logs
    timezone: tz
});

const Test = sequelize.define('Test', {
    dateVal: DataTypes.DATE
});

async function run() {
    await sequelize.sync({ force: true });
    
    // Create using Sequelize (so it formats using the timezone config)
    const t = await Test.create({ dateVal: new Date() });
    
    // Query raw value from database to see what string got written
    const [raw] = await sequelize.query("SELECT dateVal FROM Tests WHERE id = " + t.id);
    console.log('Raw database string:', raw[0].dateVal);
    
    // Query using Sequelize
    const fetched = await Test.findByPk(t.id);
    console.log('Sequelize parsed date:', fetched.dateVal);
}

run();
