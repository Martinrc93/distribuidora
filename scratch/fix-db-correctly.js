const sequelize = require('../config/db/dataBase');
const Venta = require('../models/venta');

async function fix() {
    await sequelize.sync();
    
    const ventas = await Venta.findAll({ paranoid: false });
    
    let correctedCount = 0;
    
    for (const venta of ventas) {
        if (venta.id === 26) {
            console.log(`Venta ID ${venta.id} ignorada.`);
            continue;
        }
        
        const [raw] = await sequelize.query(`SELECT fecha_emision, createdAt, updatedAt FROM Ventas WHERE id = ${venta.id}`);
        const rawFecha = raw[0].fecha_emision;
        const rawCreatedAt = raw[0].createdAt;
        const rawUpdatedAt = raw[0].updatedAt;
        
        const parseDate = (str) => {
            if (!str) return null;
            const cleanVal = str.replace(/'/g, '').replace(/\s*[+-]\d+:\d+$/, '').replace('Z', '').trim();
            const parts = cleanVal.split(' ');
            const dateStr = parts[0] + (parts[1] ? 'T' + parts[1] : '');
            return new Date(dateStr);
        };
        
        const fechaObj = parseDate(rawFecha);
        const createdObj = parseDate(rawCreatedAt);
        const updatedObj = parseDate(rawUpdatedAt);
        
        if (fechaObj) {
            // Actualmente están a 21:11. Queremos que estén a 15:11 (local).
            // Así que restamos 6 horas (6 * 60 * 60 * 1000)
            const diffMs = 6 * 60 * 60 * 1000;
            const nuevaFecha = new Date(fechaObj.getTime() - diffMs);
            const nuevaCreated = createdObj ? new Date(createdObj.getTime() - diffMs) : null;
            const nuevaUpdated = updatedObj ? new Date(updatedObj.getTime() - diffMs) : null;
            
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
            
            correctedCount++;
        }
    }
    
    console.log(`Corregidas correctamente ${correctedCount} ventas.`);
    await sequelize.close();
}

fix().catch(console.error);
