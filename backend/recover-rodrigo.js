const mongoose = require('mongoose');
const User = require('./models/User');
const Curso = require('./models/Curso');
const Materia = require('./models/Materia');
const Student = require('./models/Student');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');
const Evaluacion = require('./models/Evaluacion');
const Asistencia = require('./models/Asistencia');
const Inscripcion = require('./models/Inscripcion');
const connectDB = require('./config/db');
require('dotenv').config();

const randomGrade = (max) => Math.floor(Math.random() * (max + 1));
const randomAttendance = () => {
  const rand = Math.random();
  if (rand > 0.3) return 'A'; // 70% asiste
  if (rand > 0.15) return 'F'; // 15% falta
  if (rand > 0.05) return 'R'; // 10% retraso
  return 'L'; // 5% licencia
};
const generateRUDE = () => 'RUDE' + Math.floor(Math.random() * 1000000000);

const recoverRodrigo = async () => {
  try {
    await connectDB();
    const rodrigo = await User.findOne({ email: 'rodi@gmail.com' });
    if (!rodrigo) {
      console.log('No se encontró a Rodrigo.');
      process.exit(1);
    }

    console.log('Recuperando datos para Rodrigo...');

    // Restaurar curso 4to A si está huérfano o crear uno
    let curso = await Curso.findOne({ grado: '4to', paralelo: 'A', nivel: 'secundaria' });
    if (!curso) {
      curso = await Curso.create({
        grado: '4to',
        paralelo: 'A',
        nivel: 'secundaria',
        turno: 'mañana',
        docente: rodrigo._id,
        estudiantes: []
      });
    } else {
      curso.docente = rodrigo._id;
      await curso.save();
    }

    let materia = await Materia.findOne({ nombre: 'Matemáticas', grado: '4to', nivel: 'secundaria' });
    if (!materia) {
      materia = await Materia.create({
        nombre: 'Matemáticas',
        area: 'Ciencia, Tecnología y Producción',
        nivel: 'secundaria',
        grado: '4to',
        docenteAsignado: rodrigo._id
      });
    }

    let cuaderno = await CuadernoPedagogico.findOne({ docente: rodrigo._id, curso: curso._id, materia: materia._id });
    if (!cuaderno) {
      cuaderno = await CuadernoPedagogico.create({
        departamento: 'La Paz',
        distritoEducativo: 'Distrito 1',
        unidadEducativa: 'Colegio Central',
        docente: rodrigo._id,
        curso: curso._id,
        materia: materia._id,
        nivel: 'secundaria'
      });
    }

    // Si el curso no tiene estudiantes, agregar 10
    if (curso.estudiantes.length === 0) {
      const nombresM = ['Carlos', 'Luis', 'Pedro', 'Juan', 'Miguel'];
      const nombresF = ['Ana', 'Maria', 'Laura', 'Sofia', 'Lucia'];
      const apellidos = ['Gomez', 'Lopez', 'Perez', 'Gonzalez', 'Rodriguez'];
      const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
      
      const nuevosEsts = [];
      for (let i = 0; i < 10; i++) {
        const sexo = Math.random() > 0.5 ? 'M' : 'F';
        const nombre = sexo === 'M' ? randomItem(nombresM) : randomItem(nombresF);
        const est = await Student.create({
          nombres: nombre,
          apellidos: `${randomItem(apellidos)} ${randomItem(apellidos)}`,
          rude: generateRUDE(),
          sexo: sexo,
          curso: curso._id,
          registradoPor: rodrigo._id
        });
        nuevosEsts.push(est._id);
        
        await Inscripcion.create({
          cuaderno: cuaderno._id,
          estudiante: est._id,
          registradoPor: rodrigo._id
        });
      }
      curso.estudiantes = nuevosEsts;
      await curso.save();
    } else {
        // Asegurar que estén inscritos al cuaderno
        for (let estId of curso.estudiantes) {
            const ins = await Inscripcion.findOne({ cuaderno: cuaderno._id, estudiante: estId });
            if (!ins) {
                await Inscripcion.create({ cuaderno: cuaderno._id, estudiante: estId, registradoPor: rodrigo._id });
            }
        }
    }

    const estudiantes = curso.estudiantes;
    const trimestres = [
      { num: 1, mes: 2 },
      { num: 2, mes: 5 },
      { num: 3, mes: 8 }
    ];

    for (const tri of trimestres) {
      for (const estId of estudiantes) {
        const evalExists = await Evaluacion.findOne({ cuaderno: cuaderno._id, trimestre: tri.num, estudiante: estId });
        if (!evalExists) {
          await Evaluacion.create({
            cuaderno: cuaderno._id,
            trimestre: tri.num,
            estudiante: estId,
            ser: randomGrade(10),
            saber: randomGrade(45),
            hacer: randomGrade(40),
            autoevaluacion: randomGrade(5)
          });
        }
      }

      for (let i = 0; i < 3; i++) {
        const fecha = new Date(2026, tri.mes, 10 + i);
        fecha.setHours(0,0,0,0);
        const asistenciaExists = await Asistencia.findOne({ cuaderno: cuaderno._id, fecha: fecha });
        if (!asistenciaExists) {
          const registros = estudiantes.map(estId => ({
            estudiante: estId,
            valor: randomAttendance()
          }));
          await Asistencia.create({
            cuaderno: cuaderno._id,
            trimestre: tri.num,
            fecha: fecha,
            registros: registros,
            registradoPor: rodrigo._id
          });
        }
      }
    }

    console.log('✅ Curso y cuaderno de Rodrigo recuperados exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

recoverRodrigo();
