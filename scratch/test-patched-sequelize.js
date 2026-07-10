const sequelizeModule = require('sequelize');
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

sequelizeModule.Sequelize = PatchedSequelize;

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

console.log('Successfully initialized PatchedSequelize with timezone:', sequelize.options.timezone);
