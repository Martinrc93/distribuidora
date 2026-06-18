const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/sequelize/lib/dialects/sqlite/data-types.js');
const content = fs.readFileSync(filePath, 'utf8');
console.log(content);
