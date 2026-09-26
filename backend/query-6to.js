const mongoose = require('mongoose');
const User = require('./models/User'); 
const Curso = require('./models/Curso');
const Materia = require('./models/Materia');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');

const MONGO_URI = 'mongodb://localhost:27017/cuaderno_pedagogico';

async function fixCursos() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Conectado a MongoDB...');

    // 1. Mostrar qué cursos tenemos
    const cursos = await Curso.find({ grado: { $regex: /6/i } }).populate('docente', 'nombre email');
    
    for (const sexto of cursos) {
      console.log(`\nDetalles del curso (ID: ${sexto._id}) - Grado: ${sexto.grado}:`);
      
      const cuadernos = await CuadernoPedagogico.find({ curso: sexto._id })
        .populate('docente', 'nombre email')
        .populate('materia', 'nombre area');
        
      if (cuadernos.length > 0) {
        console.log(`  Cuadernos vinculados a este curso:`);
        for (const cuad of cuadernos) {
          console.log(`    - Materia: ${cuad.materia ? cuad.materia.nombre : '?'}`);
          console.log(`    - Docente asignado al cuaderno: ${cuad.docente ? cuad.docente.nombre : '?'} (${cuad.docente ? cuad.docente.email : '?'})`);
        }
      } else {
        console.log(`  No tiene cuadernos pedagógicos asignados.`);
      }

      // CORREGIR el nombre del curso de 6ro a 6to
      if (sexto.grado === '6ro') {
        sexto.grado = '6to';
        await sexto.save();
        console.log(`  >> ¡Corregido! El grado '6ro' fue cambiado a '6to' exitosamente.`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixCursos();
