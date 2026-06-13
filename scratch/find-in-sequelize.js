const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchDir(fullPath, query);
        } else if (file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(query)) {
                console.log(`Found in: ${fullPath}`);
            }
        }
    }
}

searchDir(path.join(__dirname, '../node_modules/sequelize/lib/dialects/sqlite'), 'parse');
searchDir(path.join(__dirname, '../node_modules/sequelize/lib/dialects/abstract'), 'parse');
