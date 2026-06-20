// Alinear base de datos, aplicación y sistema en la misma zona horaria local
try {
    const modulePath = require.resolve('sequelize/lib/dialects/sqlite/data-types');
    const originalCreator = require(modulePath);
    require.cache[modulePath].exports = function(BaseTypes) {
        const types = originalCreator(BaseTypes);
        const originalParse = types.DATE.parse;
        types.DATE.parse = function(date, options) {
            if (typeof date === 'string') {
                const cleanVal = date.replace(/'/g, '').replace(/\s*[+-]\d+:\d+$/, '').replace('Z', '').trim();
                const parts = cleanVal.split(' ');
                const dateStr = parts[0] + (parts[1] ? 'T' + parts[1] : '');
                return new Date(dateStr);
            }
            return originalParse.call(this, date, options);
        };
        return types;
    };
    
    const { DataTypes } = require('sequelize');
    const DateType = DataTypes.DATE;
    DateType.prototype.stringify = function(date, options) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
    };
} catch (e) {
    console.error('Error al configurar la alineación de zona horaria local:', e);
}
