const ListaPrecios = require('../models/listaPrecios.js');

/**
 * Verifica que existan 8 listas de precio en la base de datos ("Lista 1" a "Lista 8").
 * Si no están creadas o faltan algunas, las crea automáticamente.
 */
async function verificarYCrearListasPrecios() {
  try {
    const totalEsperado = 8;
    const listasExistentes = await ListaPrecios.findAll({ order: [['id', 'ASC']] });
    
    const nombresExistentes = new Set(listasExistentes.map(l => l.nombre));
    const idsExistentes = new Set(listasExistentes.map(l => l.id));
    
    const creadas = [];
    for (let i = 1; i <= totalEsperado; i++) {
      const nombreEsperado = `Lista ${i}`;
      if (!nombresExistentes.has(nombreEsperado)) {
        const datosLista = { nombre: nombreEsperado };
        if (!idsExistentes.has(i)) {
          datosLista.id = i;
        }
        const nuevaLista = await ListaPrecios.create(datosLista);
        creadas.push(nuevaLista.nombre);
      }
    }

    if (creadas.length > 0) {
      console.log(`[DB Init] Se crearon ${creadas.length} listas de precio faltantes: ${creadas.join(', ')}.`);
    } else {
      console.log('[DB Init] Verificación completada: Las 8 listas de precio ya existen.');
    }
  } catch (error) {
    console.error('[DB Init] Error al verificar/crear las listas de precio:', error);
    throw error;
  }
}

module.exports = { verificarYCrearListasPrecios };
