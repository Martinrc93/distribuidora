const fs = require('fs');
const filePath = 'p:/dev/proyects/dis/distribuidora/frontend/features/pedidos/pedidos.js';
let content = fs.readFileSync(filePath, 'utf8');

// Insert formatCurrency function
if (!content.includes('function formatCurrency')) {
    content = content.replace(
        "import { showToast } from '../../utils/ui.js';",
        "import { showToast } from '../../utils/ui.js';\n\nfunction formatCurrency(value) {\n    return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });\n}"
    );
}

// Replace occurrences safely
content = content.replace(/\$\$\{Number\(venta\.total\)\.toFixed\(2\)\}/g, '$$${formatCurrency(venta.total)}');
content = content.replace(/\$\$\{d\.subtotal\.toFixed\(2\)\}/g, '$$${formatCurrency(d.subtotal)}');
content = content.replace(/`\$\$\{total\.toFixed\(2\)\}`/g, '`$$${formatCurrency(total)}`');
content = content.replace(/\$\$\{item\.total\.toFixed\(2\)\}/g, '$$${formatCurrency(item.total)}');
content = content.replace(/\$\$\{totalGeneral\.toFixed\(2\)\}/g, '$$${formatCurrency(totalGeneral)}');
content = content.replace(/\$\$\{Number\(d\.precio\)\.toFixed\(2\)\}/g, '$$${formatCurrency(d.precio)}');
content = content.replace(/\$\$\{Number\(d\.subtotal\)\.toFixed\(2\)\}/g, '$$${formatCurrency(d.subtotal)}');
content = content.replace(/const totalStr = Number\(venta\.total\)\.toFixed\(2\);/g, 'const totalStr = formatCurrency(venta.total);');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced successfully.');
