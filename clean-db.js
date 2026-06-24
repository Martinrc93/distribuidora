const fs = require('fs');
const path = require('path');
const os = require('os');

// En Windows, Electron guarda userData en AppData\Roaming\<productName>
const appName = 'Distribuidora';
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', appName);
const dbFiles = [
  path.join(userDataPath, 'database.sqlite'),
  path.join(userDataPath, 'database.sqlite-wal'),
  path.join(userDataPath, 'database.sqlite-shm')
];

console.log(`Buscando archivos de base de datos en: ${userDataPath}`);

let deletedAny = false;
dbFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`✓ Eliminado: ${file}`);
      deletedAny = true;
    } catch (err) {
      console.error(`✗ Error al eliminar ${file}:`, err.message);
    }
  }
});

if (!deletedAny) {
  console.log('No se encontraron archivos de base de datos para eliminar.');
}
