const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');

async function corregirFechas() {
    await sequelize.sync();
    
    // Obtener la diferencia horaria local en milisegundos (ej. para GMT-3 es -180 minutos)
    const offsetMinutos = new Date().getTimezoneOffset();
    console.log(`Huso horario detectado: GMT${offsetMinutos <= 0 ? '+' : '-'}${Math.abs(offsetMinutos/60)} (Offset: ${offsetMinutos} minutos)`);
    
    // Si el offset es 0, no hay desfasaje que corregir
    if (offsetMinutos === 0) {
        console.log('El sistema ya está en UTC (offset 0). No hay corrección necesaria.');
        await sequelize.close();
        return;
    }

    const offsetMs = offsetMinutos * 60 * 1000;
    
    // Traer todas las ventas activas anteriores a nuestro test (ID < 26) o todas las que tengan hora desfasada
    const ventas = await Venta.findAll({ paranoid: false });
    console.log(`Encontradas ${ventas.length} ventas para analizar.`);
    
    let corregidasCount = 0;
    
    for (const venta of ventas) {
        // No corregir la venta de prueba (ID 26) que ya fue creada con el horario local correcto
        if (venta.id === 26) {
            console.log(`Venta ID ${venta.id} ignorada (ya está en horario local).`);
            continue;
        }
        
        // Obtener el valor crudo de la base de datos
        const [raw] = await sequelize.query(`SELECT fecha_emision, createdAt, updatedAt FROM Ventas WHERE id = ${venta.id}`);
        const rawFecha = raw[0].fecha_emision;
        const rawCreatedAt = raw[0].createdAt;
        const rawUpdatedAt = raw[0].updatedAt;
        
        // Modificar restando/sumando el offset para moverlo de UTC a Local
        // Si el offset es -180 (GMT-3), restamos 3 horas a la fecha guardada en la base de datos para pasarla a hora local real
        const parseDate = (str) => {
            if (!str) return null;
            // Parsear el string tal cual está en la base de datos sin timezone
            const cleanVal = str.replace(/'/g, '').replace(/\s*[+-]\d+:\d+$/, '').replace('Z', '').trim();
            const parts = cleanVal.split(' ');
            const dateStr = parts[0] + (parts[1] ? 'T' + parts[1] : '');
            return new Date(dateStr);
        };
        
        const fechaObj = parseDate(rawFecha);
        const createdObj = parseDate(rawCreatedAt);
        const updatedObj = parseDate(rawUpdatedAt);
        
        if (fechaObj) {
            // Restar el offset en MS (para GMT-3, offset es +3 horas en valor absoluto)
            const nuevaFecha = new Date(fechaObj.getTime() + offsetMs);
            const nuevaCreated = createdObj ? new Date(createdObj.getTime() + offsetMs) : null;
            const nuevaUpdated = updatedObj ? new Date(updatedObj.getTime() + offsetMs) : null;
            
            // Usar query directa para guardar el string formateado localmente sin alterar por hooks de Sequelize
            const formatLocal = (d) => {
                if (!d) return null;
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');
                const ms = String(d.getMilliseconds()).padStart(3, '0');
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
            };
            
            const sqlFecha = formatLocal(nuevaFecha);
            const sqlCreated = formatLocal(nuevaCreated);
            const sqlUpdated = formatLocal(nuevaUpdated);
            
            await sequelize.query(`
                UPDATE Ventas 
                SET fecha_emision = '${sqlFecha}', 
                    createdAt = '${sqlCreated}', 
                    updatedAt = '${sqlUpdated}' 
                WHERE id = ${venta.id}
            `);
            
            corregidasCount++;
        }
    }
    
    console.log(`Se corrigieron con éxito ${corregidasCount} ventas en la base de datos.`);
    await sequelize.close();
}

corregirFechas().catch(console.error);
