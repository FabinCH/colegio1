const mongoose = require('mongoose');
const User = require('./models/User');
const Curso = require('./models/Curso');
const Student = require('./models/Student');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');
const Asistencia = require('./models/Asistencia');
const connectDB = require('./config/db');
require('dotenv').config();

// Definición de feriados o vacaciones pedagógicas a omitir (YYYY-MM-DD en hora local)
const FERIADOS_Y_VACACIONES = new Set([
  // Carnaval (Feb 16, 17) - opcional, pero dentro del rango
  '2026-02-16', '2026-02-17',
  // Viernes Santo
  '2026-04-03',
  // Día del Trabajo
  '2026-05-01',
  // Corpus Christi
  '2026-06-04',
  // Año Nuevo Andino Amazónico
  '2026-06-21',
  // Descanso Pedagógico de Invierno (2 semanas: 6 de julio al 17 de julio de 2026)
  '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10',
  '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17',
  // Día de la Independencia de Bolivia
  '2026-08-06',
  // Día de los Difuntos (Todos Santos)
  '2026-11-02'
]);

// Función para formatear YYYY-MM-DD
function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Obtener todas las fechas válidas (Lunes a Viernes) excluyendo feriados si aplica
function getHabilesDates(startDateStr, endDateStr, filterFeriados = true) {
  const dates = [];
  let curr = new Date(startDateStr + 'T12:00:00Z');
  const end = new Date(endDateStr + 'T12:00:00Z');

  while (curr <= end) {
    const dayOfWeek = curr.getUTCDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const key = formatDateKey(new Date(curr.getTime()));
      if (!filterFeriados || !FERIADOS_Y_VACACIONES.has(key)) {
        dates.push(new Date(curr.getTime()));
      }
    }
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

// Generador de valor aleatorio realista de asistencia
// Asiste ~88%, Atraso ~4%, Licencia ~4%, Falta ~4%
function getRandomValor(studentIndex, dateIndex) {
  const rand = Math.random();
  // Hacer que algunos estudiantes específicos tengan un poquito más de faltas o atrasos para realismo
  if (studentIndex % 4 === 0) {
    if (rand < 0.10) return 'F';
    if (rand < 0.18) return 'R';
    if (rand < 0.24) return 'L';
    return 'A';
  }
  if (rand < 0.04) return 'F';
  if (rand < 0.08) return 'R';
  if (rand < 0.12) return 'L';
  return 'A';
}

const seedAsistenciasCalendario = async () => {
  try {
    await connectDB();
    console.log('Conectado a BD. Iniciando generación de asistencias según calendario escolar Bolivia 2026...');

    // 1. Obtener todos los cuadernos pedagógicos
    const cuadernos = await CuadernoPedagogico.find().populate({
      path: 'curso',
      populate: { path: 'estudiantes' }
    }).populate('docente');

    console.log(`Se encontraron ${cuadernos.length} cuadernos pedagógicos.`);

    // Definición de rangos de trimestres según indicación del usuario
    // T1: 2 de febrero al 8 de mayo (66 días hábiles approx)
    // T2: 11 de mayo al 31 de agosto (68 días hábiles approx con descanso de invierno)
    // T3: 1 de septiembre al 2 de diciembre (66 días hábiles approx)
    const periodos = [
      { trimestre: 1, inicio: '2026-02-02', fin: '2026-05-08' },
      { trimestre: 2, inicio: '2026-05-11', fin: '2026-08-31' },
      { trimestre: 3, inicio: '2026-09-01', fin: '2026-12-02' }
    ];

    let totalAsistenciasCreadas = 0;

    for (const cuaderno of cuadernos) {
      if (!cuaderno.curso || !cuaderno.curso.estudiantes || cuaderno.curso.estudiantes.length === 0) {
        console.log(`⚠️ Cuaderno ${cuaderno._id} sin curso o sin estudiantes. Omitiendo...`);
        continue;
      }

      const estudiantes = cuaderno.curso.estudiantes;
      console.log(`\n📌 Procesando Cuaderno: ${cuaderno._id} | Docente: ${cuaderno.docente ? cuaderno.docente.nombre : 'Sin docente'} | Curso: ${cuaderno.curso.grado} ${cuaderno.curso.paralelo} (${estudiantes.length} estudiantes)`);

      // Eliminar asistencias previas de este cuaderno para evitar choques con el índice único (cuaderno, fecha)
      await Asistencia.deleteMany({ cuaderno: cuaderno._id });
      console.log(`   - Asistencias previas eliminadas.`);

      const docsToInsert = [];

      for (const p of periodos) {
        const fechas = getHabilesDates(p.inicio, p.fin, true);
        console.log(`   - Trimestre ${p.trimestre}: ${fechas.length} días hábiles generados (${p.inicio} al ${p.fin})`);

        for (let dIdx = 0; dIdx < fechas.length; dIdx++) {
          const fechaObj = fechas[dIdx];
          
          const registros = estudiantes.map((est, eIdx) => ({
            estudiante: est._id || est,
            valor: getRandomValor(eIdx, dIdx)
          }));

          docsToInsert.push({
            cuaderno: cuaderno._id,
            trimestre: p.trimestre,
            fecha: fechaObj,
            registros: registros,
            registradoPor: cuaderno.docente ? cuaderno.docente._id : null
          });
        }
      }

      if (docsToInsert.length > 0) {
        await Asistencia.insertMany(docsToInsert);
        totalAsistenciasCreadas += docsToInsert.length;
        console.log(`   ✅ Guardadas ${docsToInsert.length} sesiones diarias de asistencia.`);
      }
    }

    console.log(`\n🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!`);
    console.log(`Total de registros diarios de asistencia creados en la BD: ${totalAsistenciasCreadas}`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Error ejecutando seedAsistenciasCalendario:', err);
    process.exit(1);
  }
};

seedAsistenciasCalendario();
