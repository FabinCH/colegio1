// ============================================
// migrar-a-atlas.js — Copia tu Base de Datos Local a MongoDB Atlas
// ============================================
//
// USO:
// 1. En tu archivo .env agrega la variable ATLAS_URI con tu enlace de MongoDB Atlas.
//    Ejemplo: ATLAS_URI=mongodb+srv://usuario:password@cluster.mongodb.net/cuaderno_pedagogico
// 2. Ejecuta en tu terminal: node migrar-a-atlas.js

const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const LOCAL_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cuaderno_pedagogico';
const ATLAS_URI = process.env.ATLAS_URI;

if (!ATLAS_URI || ATLAS_URI.includes('TU_CONTRASEÑA')) {
  console.error('\n❌ ERROR: Debes definir la variable ATLAS_URI en tu archivo .env con tu conexión real de MongoDB Atlas.\n');
  console.log('Ejemplo en .env:');
  console.log('ATLAS_URI=mongodb+srv://admin:mi_password@cluster0.abcde.mongodb.net/cuaderno_pedagogico?retryWrites=true&w=majority\n');
  process.exit(1);
}

const migrar = async () => {
  let connLocal, connAtlas;
  try {
    console.log('⏳ Conectando a MongoDB LOCAL...');
    connLocal = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Conectado a MongoDB LOCAL.');

    console.log('⏳ Conectando a MongoDB ATLAS (Nube)...');
    connAtlas = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('✅ Conectado a MongoDB ATLAS.');

    const colecciones = await connLocal.db.listCollections().toArray();

    if (colecciones.length === 0) {
      console.log('⚠️ No se encontraron colecciones en la base de datos local.');
      process.exit(0);
    }

    console.log(`\n📦 Se encontraron ${colecciones.length} colecciones para migrar:\n`);

    for (const col of colecciones) {
      const nombreCol = col.name;
      if (nombreCol.startsWith('system.')) continue;

      const datos = await connLocal.db.collection(nombreCol).find({}).toArray();

      if (datos.length > 0) {
        // Limpiar colección de destino en Atlas e insertar datos
        await connAtlas.db.collection(nombreCol).deleteMany({});
        await connAtlas.db.collection(nombreCol).insertMany(datos);
        console.log(`  ✓ Colección '${nombreCol}': ${datos.length} documentos migrados a Atlas.`);
      } else {
        console.log(`  - Colección '${nombreCol}': vacía, se omitió.`);
      }
    }

    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO A MONGODB ATLAS!');
    console.log('Ahora solo cambia MONGO_URI en tu .env con la dirección de Atlas para usar la nube.\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error.message);
  } finally {
    if (connLocal) await connLocal.close();
    if (connAtlas) await connAtlas.close();
    process.exit(0);
  }
};

migrar();
