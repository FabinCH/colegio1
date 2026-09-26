const mongoose = require('mongoose');
const User = require('./models/User');
const Curso = require('./models/Curso');
const Materia = require('./models/Materia');
const Student = require('./models/Student');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');
const Inscripcion = require('./models/Inscripcion');
const connectDB = require('./config/db');
require('dotenv').config();

const nombresM = ['Carlos', 'Luis', 'Pedro', 'Juan', 'Miguel', 'Diego', 'Jose', 'Andres', 'Fernando', 'Roberto'];
const nombresF = ['Ana', 'Maria', 'Laura', 'Sofia', 'Lucia', 'Carmen', 'Elena', 'Marta', 'Paula', 'Rosa'];
const apellidos = ['Gomez', 'Lopez', 'Perez', 'Gonzalez', 'Rodriguez', 'Fernandez', 'Garcia', 'Martinez', 'Sanchez', 'Diaz'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateRUDE = () => 'RUDE' + Math.floor(Math.random() * 1000000000);

const seedData = async () => {
  try {
    await connectDB();

    const raul = await User.findOne({ email: 'raul@colegio.com' });
    const jorge = await User.findOne({ email: 'jorge@colegio.com' });

    if (!raul || !jorge) {
      console.log('Error: No se encontraron los usuarios Raul o Jorge');
      process.exit(1);
    }

    // --- SETUP PARA RAUL ---
    console.log('Creando datos para Raul...');
    let cursoRaul = await Curso.findOne({ grado: '4to', paralelo: 'A', nivel: 'secundaria' });
    if (!cursoRaul) {
      cursoRaul = await Curso.create({
        grado: '4to',
        paralelo: 'A',
        nivel: 'secundaria',
        turno: 'mañana',
        docente: raul._id,
        estudiantes: []
      });
    }

    let materiaRaul = await Materia.findOne({ nombre: 'Matemáticas', grado: '4to', nivel: 'secundaria' });
    if (!materiaRaul) {
      materiaRaul = await Materia.create({
        nombre: 'Matemáticas',
        area: 'Ciencia, Tecnología y Producción',
        nivel: 'secundaria',
        grado: '4to',
        docenteAsignado: raul._id
      });
    }

    const estudiantesRaul = [];
    for (let i = 0; i < 10; i++) {
      const sexo = Math.random() > 0.5 ? 'M' : 'F';
      const nombre = sexo === 'M' ? randomItem(nombresM) : randomItem(nombresF);
      const est = await Student.create({
        nombres: nombre,
        apellidos: `${randomItem(apellidos)} ${randomItem(apellidos)}`,
        rude: generateRUDE(),
        ci: Math.floor(Math.random() * 10000000) + ' LP',
        sexo: sexo,
        curso: cursoRaul._id,
        registradoPor: raul._id
      });
      estudiantesRaul.push(est._id);
    }

    cursoRaul.estudiantes = estudiantesRaul;
    await cursoRaul.save();

    let cuadernoRaul = await CuadernoPedagogico.findOne({ docente: raul._id, curso: cursoRaul._id, materia: materiaRaul._id });
    if (!cuadernoRaul) {
      cuadernoRaul = await CuadernoPedagogico.create({
        departamento: 'La Paz',
        distritoEducativo: 'Distrito 1',
        unidadEducativa: 'Colegio Central',
        docente: raul._id,
        curso: cursoRaul._id,
        materia: materiaRaul._id,
        nivel: 'secundaria'
      });
    }

    for (let estId of estudiantesRaul) {
      await Inscripcion.create({
        cuaderno: cuadernoRaul._id,
        estudiante: estId,
        registradoPor: raul._id
      });
    }

    // --- SETUP PARA JORGE ---
    console.log('Creando datos para Jorge...');
    let cursoJorge = await Curso.findOne({ grado: '5to', paralelo: 'B', nivel: 'secundaria' });
    if (!cursoJorge) {
      cursoJorge = await Curso.create({
        grado: '5to',
        paralelo: 'B',
        nivel: 'secundaria',
        turno: 'tarde',
        docente: jorge._id,
        estudiantes: []
      });
    }

    let materiaJorge = await Materia.findOne({ nombre: 'Física', grado: '5to', nivel: 'secundaria' });
    if (!materiaJorge) {
      materiaJorge = await Materia.create({
        nombre: 'Física',
        area: 'Ciencia, Tecnología y Producción',
        nivel: 'secundaria',
        grado: '5to',
        docenteAsignado: jorge._id
      });
    }

    const estudiantesJorge = [];
    for (let i = 0; i < 10; i++) {
      const sexo = Math.random() > 0.5 ? 'M' : 'F';
      const nombre = sexo === 'M' ? randomItem(nombresM) : randomItem(nombresF);
      const est = await Student.create({
        nombres: nombre,
        apellidos: `${randomItem(apellidos)} ${randomItem(apellidos)}`,
        rude: generateRUDE(),
        ci: Math.floor(Math.random() * 10000000) + ' LP',
        sexo: sexo,
        curso: cursoJorge._id,
        registradoPor: jorge._id
      });
      estudiantesJorge.push(est._id);
    }

    cursoJorge.estudiantes = estudiantesJorge;
    await cursoJorge.save();

    let cuadernoJorge = await CuadernoPedagogico.findOne({ docente: jorge._id, curso: cursoJorge._id, materia: materiaJorge._id });
    if (!cuadernoJorge) {
      cuadernoJorge = await CuadernoPedagogico.create({
        departamento: 'La Paz',
        distritoEducativo: 'Distrito 1',
        unidadEducativa: 'Colegio Central',
        docente: jorge._id,
        curso: cursoJorge._id,
        materia: materiaJorge._id,
        nivel: 'secundaria'
      });
    }

    for (let estId of estudiantesJorge) {
      await Inscripcion.create({
        cuaderno: cuadernoJorge._id,
        estudiante: estId,
        registradoPor: jorge._id
      });
    }

    console.log('✅ Datos creados exitosamente!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
