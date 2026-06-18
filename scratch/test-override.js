const { Sequelize, DataTypes } = require('sequelize');

// Override DATE stringify for SQLite
const DateType = DataTypes.DATE;
const originalStringify = DateType.prototype.stringify;

DateType.prototype.stringify = function(date, options) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    // Format as local YYYY-MM-DD HH:mm:ss.SSS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    
    return `'${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}'`;
};

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: true
});

const Test = sequelize.define('Test', {
    dateVal: DataTypes.DATE
});

async function run() {
    await sequelize.sync({ force: true });
    
    const localNow = new Date();
    console.log('Local time to insert:', localNow.toString());
    
    const t = await Test.create({ dateVal: localNow });
    
    // Fetch raw
    const [raw] = await sequelize.query("SELECT dateVal FROM Tests WHERE id = " + t.id);
    console.log('Stored value in DB:', raw[0].dateVal);
    
    // Fetch via Sequelize
    const fetched = await Test.findByPk(t.id);
    console.log('Fetched value from Sequelize:', fetched.dateVal.toString());
}

run();
