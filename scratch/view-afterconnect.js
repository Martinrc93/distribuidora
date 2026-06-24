const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/sequelize/lib/dialects/abstract/connection-manager.js');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('afterConnect')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
