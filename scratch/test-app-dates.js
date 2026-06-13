const path = require('path');

// Hook connection cache first
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
        return `'${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}'`;
    };
} catch (e) {
    console.error(e);
}

const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');

async function check() {
    try {
        const [raw] = await sequelize.query("SELECT id, fecha_emision FROM Ventas");
        console.log('--- Raw strings stored in SQLite Ventas table:');
        console.log(raw);
        
        console.log('--- Sequelize parsed date properties (should match raw local time):');
        const ventas = await Venta.findAll();
        for (const v of ventas) {
            console.log(`id: ${v.id}, fechaEmision: ${v.fechaEmision.toString()}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await sequelize.close();
    }
}

check();
