const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../Productos.txt');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const brands = [];
const products = [];

let currentBrandIndex = -1;

for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.startsWith('-')) {
        const productName = line.substring(1).trim();
        if (currentBrandIndex === -1) {
            console.error(`Error: Product without brand: ${line}`);
            continue;
        }
        products.push({
            name: productName,
            brandIndex: currentBrandIndex
        });
    } else {
        brands.push(line);
        currentBrandIndex = brands.length - 1;
    }
}

console.log(`Parsed ${brands.length} brands:`);
console.log(JSON.stringify(brands, null, 2));
console.log(`Parsed ${products.length} products. Example:`);
console.log(JSON.stringify(products.slice(0, 5), null, 2));
