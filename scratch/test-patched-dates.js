const sequelizeModule = require('sequelize');
const { DataTypes } = sequelizeModule;
const OriginalSequelize = sequelizeModule.Sequelize;

class PatchedSequelize extends OriginalSequelize {
    constructor(database, username, password, options) {
        let opts = options;
        let db = database;
        let user = username;
        let pass = password;
        
        if (typeof database === 'object') {
            opts = database;
        }
        
        if (opts && opts.dialect === 'sqlite' && opts.timezone && opts.timezone !== '+00:00') {
            const desiredTz = opts.timezone;
            opts.timezone = '+00:00';
            
            if (typeof database === 'object') {
                super(opts);
            } else {
                super(db, user, pass, opts);
            }
            
            this.options.timezone = desiredTz;
        } else {
            if (typeof database === 'object') {
                super(opts);
            } else {
                super(db, user, pass, opts);
            }
        }
    }
}

function getLocalTimezoneOffset() {
    const offset = new Date().getTimezoneOffset();
    const absOffset = Math.abs(offset);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');
    const sign = offset <= 0 ? '+' : '-';
    return `${sign}${hours}:${minutes}`;
}

const tz = getLocalTimezoneOffset();
console.log('Local timezone offset:', tz);

const sequelize = new PatchedSequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: console.log,
    timezone: tz
});

const Test = sequelize.define('Test', {
    dateVal: DataTypes.DATE
});

async function run() {
    await sequelize.sync({ force: true });
    
    const localNow = new Date();
    console.log('JS localNow:', localNow.toString());
    console.log('JS localNow.toISOString():', localNow.toISOString());
    
    const t = await Test.create({ dateVal: localNow });
    
    const [raw] = await sequelize.query("SELECT dateVal FROM Tests WHERE id = " + t.id);
    console.log('Stored string in SQLite:', raw[0].dateVal);
    
    const fetched = await Test.findByPk(t.id);
    console.log('Fetched date from Sequelize:', fetched.dateVal.toString());
    console.log('Fetched date ISO:', fetched.dateVal.toISOString());
    
    await sequelize.close();
}

run().catch(console.error);
