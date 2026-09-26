const mongoose = require('mongoose');
const User = require('./models/User');
const Curso = require('./models/Curso');
const Materia = require('./models/Materia');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');
const Evaluacion = require('./models/Evaluacion');
const connectDB = require('./config/db');
require('dotenv').config();

const findRodrigo = async () => {
  try {
    await connectDB();
    const rodrigos = await User.find({ nombre: { $regex: /rodrigo/i } });
    if (rodrigos.length === 0) {
      console.log('No user named Rodrigo found in DB.');
    } else {
      for (const rodrigo of rodrigos) {
        console.log(`Found Rodrigo: ${rodrigo.nombre} (email: ${rodrigo.email}, id: ${rodrigo._id})`);
        const cuadernos = await CuadernoPedagogico.find({ docente: rodrigo._id })
            .populate('curso')
            .populate('materia');
        console.log(`  Cuadernos: ${cuadernos.length}`);
        for (const c of cuadernos) {
            console.log(`    - Materia: ${c.materia.nombre}, Curso: ${c.curso.grado} ${c.curso.paralelo} ${c.curso.nivel}`);
            const evaluaciones = await Evaluacion.find({ cuaderno: c._id });
            console.log(`      Evaluaciones totales: ${evaluaciones.length}`);
            if (evaluaciones.length > 0) {
                console.log(`      Ejemplo de Evaluacion: Trimestre ${evaluaciones[0].trimestre}, Ser: ${evaluaciones[0].ser}, Saber: ${evaluaciones[0].saber}, Hacer: ${evaluaciones[0].hacer}, Auto: ${evaluaciones[0].autoevaluacion}, Total: ${evaluaciones[0].total}`);
            }
        }
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findRodrigo();
