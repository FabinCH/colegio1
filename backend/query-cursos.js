const mongoose = require('mongoose');
const User = require('./models/User'); // Import User so Mongoose knows it
const Curso = require('./models/Curso');
const Materia = require('./models/Materia');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');

const MONGO_URI = 'mongodb://localhost:27017/cuaderno_pedagogico';

async function fixCursos() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB...');

    // 1. Mostrar qué cursos tenemos
    const cursos = await Curso.find().populate('docente', 'nombre');
    console.log('--- CURSOS EN DB ---');
    for (const c of cursos) {
      console.log(`ID: ${c._id} | Grado: ${c.grado} "${c.paralelo}" (${c.nivel}) | Docente: ${c.docente ? c.docente.nombre : 'Ninguno'}`);
    }

    // 2. Si existe un curso de '6to', ver qué docente lo tiene y en qué cuadernos está
    const sextos = cursos.filter(c => c.grado.toLowerCase().includes('6to'));
    if (sextos.length > 0) {
      for (const sexto of sextos) {
        console.log(`\nDetalles del curso 6to (ID: ${sexto._id}):`);
        
        const cuadernos = await CuadernoPedagogico.find({ curso: sexto._id })
          .populate('docente', 'nombre')
          .populate('materia', 'nombre');
          
        if (cuadernos.length > 0) {
          console.log(`  Cuadernos vinculados a este curso:`);
          for (const cuad of cuadernos) {
            console.log(`    - Materia: ${cuad.materia ? cuad.materia.nombre : '?'}`);
            console.log(`    - Docente asignado: ${cuad.docente ? cuad.docente.nombre : '?'}`);
          }
        } else {
          console.log(`  No tiene cuadernos pedagógicos asignados.`);
        }
      }
    } else {
      console.log('\nNo se encontró ningún curso "6to".');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixCursos();
