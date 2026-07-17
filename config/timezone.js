// Alinear base de datos, aplicación y sistema en la misma zona horaria local
// IMPORTANTE: Este archivo realiza monkey-patching en los componentes internos de Sequelize.
// Ha sido testeado y es compatible con Sequelize versión 6.37.8.
// Si se actualiza Sequelize a una versión mayor (ej. v7), verificar la compatibilidad de esta solución.

// Asegurar que la zona horaria del proceso Node.js coincida exactamente con la del sistema
if (!process.env.TZ) {
    try {
        process.env.TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
        console.error('Error al detectar la zona horaria del sistema:', e);
    }
}

try {
    const { DataTypes } = require('sequelize');

    // 1. Sobrescribir stringify para que las fechas se guarden en formato local YYYY-MM-DD HH:mm:ss.SSS en SQLite
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

    // 2. Sobrescribir el parser de SQLite directamente en el parserStore de Sequelize.
    // Interceptamos la creación del wrapper del parserStore en require.cache para asegurar que
    // cualquier conexión obtenga siempre nuestro parser personalizado para DATETIME,
    // impidiendo que inicializaciones o refrescos de Sequelize dialect pisen la configuración.
    try {
        const modulePath = require.resolve('sequelize/lib/dialects/parserStore');
        const originalFactory = require(modulePath);
        
        // Creamos nuestro customParse referenciando la función original por si acaso
        const originalStore = originalFactory('sqlite');
        const originalParse = originalStore.get('DATETIME');

        const customParse = function(value, options) {
            if (typeof value === 'string') {
                const cleanVal = value.replace(/'/g, '').replace(/\s*[+-]\d+:\d+$/, '').replace('Z', '').trim();
                const parts = cleanVal.split(' ');
                const dateStr = parts[0] + (parts[1] ? 'T' + parts[1] : '');
                return new Date(dateStr);
            }
            return originalParse ? originalParse(value, options) : new Date(value);
        };

        // Sobrescribimos el factory en la cache de módulos
        require.cache[modulePath].exports = function(dialect) {
            const store = originalFactory(dialect);
            if (dialect === 'sqlite') {
                const originalGet = store.get;
                store.get = function(type) {
                    if (type === 'DATETIME') {
                        return customParse;
                    }
                    return originalGet.call(this, type);
                };
            }
            return store;
        };

        // También aplicamos el refresh en la instancia actual por si ya se cargó en algún lado
        const currentStore = require('sequelize/lib/dialects/parserStore')('sqlite');
        currentStore.refresh({
            types: {
                sqlite: ['DATETIME']
            },
            parse: customParse
        });

    } catch (err) {
        console.warn('ADVERTENCIA: No se pudo configurar el interceptor de "sequelize/lib/dialects/parserStore". Es posible que la versión de Sequelize sea incompatible.', err);
    }
} catch (e) {
    console.error('Error al configurar la alineación de zona horaria local:', e);
}
