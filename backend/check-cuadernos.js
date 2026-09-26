const mongoose = require('mongoose');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');
const Curso = require('./models/Curso');
const Materia = require('./models/Materia');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const checkCuadernos = async () => {
  try {
    await connectDB();
    const cuadernos = await CuadernoPedagogico.find().populate('curso').populate('docente').populate('materia');
    console.log(`Total cuadernos: ${cuadernos.length}`);
    for (const c of cuadernos) {
      console.log(`- Docente: ${c.docente ? c.docente.nombre : 'Ninguno'}, Curso: ${c.curso ? c.curso.grado + ' ' + c.curso.paralelo : 'ELIMINADO'}, Materia: ${c.materia ? c.materia.nombre : 'ELIMINADO'}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCuadernos();
