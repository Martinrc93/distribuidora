const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const os = require('os');
const fs = require('fs');

const localDbPath = path.join(__dirname, '..', 'database.sqlite');
const electronDbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Distribuidora', 'database.sqlite');

console.log('--------------------------------------------------');
console.log('Iniciando copia de productos a base de datos de Electron');
console.log('Origen (Localhost):', localDbPath);
console.log('Destino (Electron):', electronDbPath);
console.log('--------------------------------------------------');

if (!fs.existsSync(localDbPath)) {
  console.error('❌ Error: El archivo de base de datos local no existe.');
  process.exit(1);
}
if (!fs.existsSync(electronDbPath)) {
  console.error('❌ Error: El archivo de base de datos de Electron no existe en AppData.');
  process.exit(1);
}

// Abrir conexiones
const localDb = new sqlite3.Database(localDbPath);
const electronDb = new sqlite3.Database(electronDbPath);

function all(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function copyTable(sourceDb, targetDb, tableName) {
  const rows = await all(sourceDb, `SELECT * FROM ${tableName}`);
  console.log(`   - Copiando ${tableName} (${rows.length} registros)...`);
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

  const stmt = targetDb.prepare(sql);
  for (const row of rows) {
    const values = columns.map(col => row[col]);
    await new Promise((resolve, reject) => {
      stmt.run(values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  await new Promise((resolve, reject) => stmt.finalize(resolve));
}

async function main() {
  try {
    // 1. Desactivar llaves foráneas y limpiar destino
    console.log('1. Preparando base de datos de Electron...');
    await run(electronDb, 'PRAGMA foreign_keys = OFF;');
    
    console.log('   - Limpiando tabla Prices...');
    await run(electronDb, 'DELETE FROM Prices;');
    console.log('   - Limpiando tabla Products...');
    await run(electronDb, 'DELETE FROM Products;');
    console.log('   - Limpiando tabla Marcas...');
    await run(electronDb, 'DELETE FROM Marcas;');
    console.log('   - Limpiando tabla ListaPrecios...');
    await run(electronDb, 'DELETE FROM ListaPrecios;');

    // 2. Transferir tablas en orden
    console.log('\n2. Transfiriendo datos...');
    await copyTable(localDb, electronDb, 'ListaPrecios');
    await copyTable(localDb, electronDb, 'Marcas');
    await copyTable(localDb, electronDb, 'Products');
    await copyTable(localDb, electronDb, 'Prices');

    // 3. Reactivar llaves foráneas y cerrar
    console.log('\n3. Finalizando...');
    await run(electronDb, 'PRAGMA foreign_keys = ON;');
    console.log('🟢 Sincronización de productos finalizada exitosamente.');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('\n❌ Ocurrió un error durante la copia:', error);
    try {
      await run(electronDb, 'PRAGMA foreign_keys = ON;');
    } catch (e) {}
  } finally {
    localDb.close();
    electronDb.close();
  }
}

main();
