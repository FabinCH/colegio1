const mongoose = require('mongoose');
const User = require('./models/User');
const Curso = require('./models/Curso');
const Materia = require('./models/Materia');
const Student = require('./models/Student');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');
const Evaluacion = require('./models/Evaluacion');
const Asistencia = require('./models/Asistencia');
const connectDB = require('./config/db');
require('dotenv').config();

const randomGrade = (max) => Math.floor(Math.random() * (max + 1));
const randomAttendance = () => {
  const rand = Math.random();
  if (rand > 0.3) return 'A'; 
  if (rand > 0.15) return 'F'; 
  if (rand > 0.05) return 'R'; 
  return 'L'; 
};

const seedNotas = async () => {
  try {
    await connectDB();

    const raul = await User.findOne({ email: 'raul@colegio.com' });
    const jorge = await User.findOne({ email: 'jorge@colegio.com' });

    if (!raul || !jorge) {
      console.log('Error: No se encontraron los usuarios Raul o Jorge');
      process.exit(1);
    }

    const cuadernos = await CuadernoPedagogico.find({ docente: { $in: [raul._id, jorge._id] } }).populate('curso');

    if (cuadernos.length === 0) {
      console.log('No se encontraron cuadernos pedagógicos. Debes correr seed-cursos.js primero.');
      process.exit(1);
    }

    for (const cuaderno of cuadernos) {
      const estudiantes = cuaderno.curso.estudiantes; 
      if (estudiantes.length === 0) continue;

      console.log(`Generando datos para cuaderno de ${cuaderno.docente.equals(raul._id) ? 'Raul' : 'Jorge'}...`);

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
              registradoPor: cuaderno.docente
            });
          }
        }
      }
    }

    console.log('✅ Evaluaciones y asistencias creadas exitosamente!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedNotas();
