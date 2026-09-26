const mongoose = require('mongoose');
const Curso = require('./models/Curso');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

const checkCursos = async () => {
  try {
    await connectDB();
    const cursos = await Curso.find().populate('docente');
    console.log(`Total cursos encontrados: ${cursos.length}`);
    for (const c of cursos) {
      console.log(` - ${c.grado} ${c.paralelo} ${c.nivel} (Docente: ${c.docente ? c.docente.nombre : 'Ninguno'}, Estudiantes: ${c.estudiantes.length})`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCursos();
