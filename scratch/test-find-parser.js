const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
});

// Let's search all objects in sequelize for the DATE parser
function search(obj, path = 'sequelize', visited = new Set()) {
    if (!obj || typeof obj !== 'object' || visited.has(obj)) return;
    visited.add(obj);
    
    for (const key of Object.keys(obj)) {
        try {
            const val = obj[key];
            if (key === 'DATE' && val) {
                console.log(`Found DATE at ${path}.DATE:`, Object.keys(val));
                if (val.parse) console.log(`  parse function at ${path}.DATE.parse`);
            }
            if (typeof val === 'object' && val !== null) {
                search(val, `${path}.${key}`, visited);
            }
        } catch (e) {}
    }
}

search(sequelize);
console.log('Search completed.');
