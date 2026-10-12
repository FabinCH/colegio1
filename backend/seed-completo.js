

'use strict';
const mongoose   = require('mongoose');
const User       = require('./models/User');
const Curso      = require('./models/Curso');
const Materia    = require('./models/Materia');
const Student    = require('./models/Student');
const CuadernoPedagogico = require('./models/CuadernoPedagogico');
const Evaluacion = require('./models/Evaluacion');
const Asistencia = require('./models/Asistencia');
const Inscripcion = require('./models/Inscripcion');
const connectDB  = require('./config/db');
require('dotenv').config();

const nombresM   = ['Carlos','Luis','Pedro','Juan','Miguel','Diego','Jose','Andres','Fernando','Roberto','Marco','Victor'];
const nombresF   = ['Ana','Maria','Laura','Sofia','Lucia','Carmen','Elena','Marta','Paula','Rosa','Valentina','Camila'];
const apellidos1 = ['Gomez','Lopez','Perez','Gonzalez','Rodriguez','Fernandez','Garcia','Martinez','Sanchez','Diaz'];
const apellidos2 = ['Vargas','Molina','Castro','Ramos','Herrera','Jimenez','Ruiz','Flores','Morales','Ortiz'];

const rnd    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const genRUDE = () => 'RUDE' + Math.floor(Math.random() * 1_000_000_000).toString().padStart(9, '0');

const notaBuena = () => ({
  ser:           rndInt(7, 10),
  saber:         rndInt(30, 45),
  hacer:         rndInt(28, 40),
  autoevaluacion: rndInt(3, 5),
});

const notaMala = () => ({
  ser:           rndInt(0, 5),
  saber:         rndInt(5, 22),
  hacer:         rndInt(3, 18),
  autoevaluacion: rndInt(0, 2),
});

const asistNormal = () => {
  const r = Math.random();
  if (r > 0.92) return 'F';   
  if (r > 0.87) return 'R';   
  if (r > 0.85) return 'L';   
  return 'A';                  
};

const asistMala = () => {
  const r = Math.random();
  if (r > 0.45) return 'F';   
  if (r > 0.35) return 'R';   
  if (r > 0.30) return 'L';   
  return 'A';                  
};

const TRIMESTRES = [
  { num: 1, mes: 2,  dias: [3, 5, 10, 12, 17] },   
  { num: 2, mes: 5,  dias: [2, 4, 9, 11, 16] },    
  { num: 3, mes: 8,  dias: [1, 3, 8, 10, 15] },    
];

async function asegurarEstudiantes(curso, cantidad, registradoPor) {
  let ids = [...curso.estudiantes];
  if (ids.length >= cantidad) return ids.slice(0, cantidad);

  const faltan = cantidad - ids.length;
  for (let i = 0; i < faltan; i++) {
    const sexo   = Math.random() > 0.5 ? 'M' : 'F';
    const nombre = sexo === 'M' ? rnd(nombresM) : rnd(nombresF);
    const est = await Student.create({
      nombres:   nombre,
      apellidos: `${rnd(apellidos1)} ${rnd(apellidos2)}`,
      rude:      genRUDE(),
      ci:        `${rndInt(1_000_000, 9_999_999)} LP`,
      sexo,
      curso: curso._id,
      registradoPor,
    });
    ids.push(est._id);
  }
  curso.estudiantes = ids;
  await curso.save();
  return ids;
}

async function seedEvaluaciones(cuaderno, estIds, malosIdx) {
  for (const tri of TRIMESTRES) {
    for (let i = 0; i < estIds.length; i++) {
      const estId = estIds[i];
      const esMalo = malosIdx.includes(i);
      const notas  = esMalo ? notaMala() : notaBuena();
      const total  = notas.ser + notas.saber + notas.hacer + notas.autoevaluacion;

      await Evaluacion.findOneAndUpdate(
        { cuaderno: cuaderno._id, trimestre: tri.num, estudiante: estId },
        { ...notas, total },
        { upsert: true, new: true, runValidators: false }
      );
    }
  }
}

async function seedAsistencias(cuaderno, estIds, malosIdx) {
  for (const tri of TRIMESTRES) {
    for (const dia of tri.dias) {
      const fecha = new Date(2026, tri.mes, dia, 0, 0, 0, 0);

      await Asistencia.deleteOne({ cuaderno: cuaderno._id, trimestre: tri.num, fecha });

      const registros = estIds.map((estId, i) => ({
        estudiante: estId,
        valor: malosIdx.includes(i) ? asistMala() : asistNormal(),
      }));

      await Asistencia.create({
        cuaderno:      cuaderno._id,
        trimestre:     tri.num,
        fecha,
        registros,
        registradoPor: cuaderno.docente,
      });
    }
  }
}

async function main() {
  await connectDB();
  console.log('✅ Conectado a MongoDB\n');

  const raul = await User.findOne({ email: 'raul@colegio.com' });
  if (!raul) {
    console.error('❌ No se encontró docente raul@colegio.com. Corre create-docentes.js primero.');
    process.exit(1);
  }
  console.log(`👤 Docente Raul encontrado: ${raul._id}`);

  let curso4toA = await Curso.findOne({ grado: '4to', paralelo: 'A', nivel: 'secundaria' });
  if (!curso4toA) {
    curso4toA = await Curso.create({
      grado: '4to', paralelo: 'A', nivel: 'secundaria',
      turno: 'mañana', docente: raul._id, gestion: 2026, estudiantes: [],
    });
    console.log('📚 Curso 4to A creado');
  } else {
    
    if (!curso4toA.docente || String(curso4toA.docente) !== String(raul._id)) {
      curso4toA.docente = raul._id;
      await curso4toA.save();
    }
    console.log(`📚 Curso 4to A encontrado: ${curso4toA._id}`);
  }

  let materiaRaul = await Materia.findOne({ nombre: 'Matemáticas', grado: '4to', nivel: 'secundaria' });
  if (!materiaRaul) {
    materiaRaul = await Materia.create({
      nombre: 'Matemáticas',
      area:   'Ciencia, Tecnología y Producción',
      nivel:  'secundaria',
      grado:  '4to',
      docenteAsignado: raul._id,
    });
    console.log('📖 Materia Matemáticas 4to creada');
  } else {
    if (!materiaRaul.docenteAsignado || String(materiaRaul.docenteAsignado) !== String(raul._id)) {
      materiaRaul.docenteAsignado = raul._id;
      await materiaRaul.save();
    }
    console.log(`📖 Materia encontrada: ${materiaRaul._id}`);
  }

  const estudiantesRaul = await asegurarEstudiantes(curso4toA, 12, raul._id);
  console.log(`👥 Estudiantes en 4to A: ${estudiantesRaul.length}`);

  let cuadernoRaul = await CuadernoPedagogico.findOne({
    docente: raul._id, curso: curso4toA._id, materia: materiaRaul._id,
  });
  if (!cuadernoRaul) {
    cuadernoRaul = await CuadernoPedagogico.create({
      departamento:       'La Paz',
      distritoEducativo:  'La Paz 1',
      unidadEducativa:    'Unidad Educativa Central',
      director:           'Lic. María Torres',
      docente:            raul._id,
      curso:              curso4toA._id,
      materia:            materiaRaul._id,
      nivel:              'secundaria',
      gestion:            2026,
    });
    console.log('📋 Cuaderno pedagógico de Raul creado');
  } else {
    console.log(`📋 Cuaderno de Raul encontrado: ${cuadernoRaul._id}`);
  }

  for (const estId of estudiantesRaul) {
    const exists = await Inscripcion.findOne({ cuaderno: cuadernoRaul._id, estudiante: estId });
    if (!exists) {
      await Inscripcion.create({ cuaderno: cuadernoRaul._id, estudiante: estId, registradoPor: raul._id });
    }
  }
  console.log('✅ Inscripciones de Raul verificadas');

  const malosRaul = [0, 1, 2, 3]; 
  await seedEvaluaciones(cuadernoRaul, estudiantesRaul, malosRaul);
  await seedAsistencias(cuadernoRaul, estudiantesRaul, malosRaul);
  console.log('✅ Evaluaciones y asistencias de Raul generadas (4to A)\n');

  const evalCount4to = await Evaluacion.countDocuments({ cuaderno: cuadernoRaul._id });
  const asisCount4to = await Asistencia.countDocuments({ cuaderno: cuadernoRaul._id });
  if (evalCount4to === 0 || asisCount4to === 0) {
    console.warn('⚠️  Falta datos en cuaderno 4to A (evaluaciones o asistencias). Regenerando...');
    const malosRaulTmp = [0, 1, 2, 3]; 
    await seedEvaluaciones(cuadernoRaul, estudiantesRaul, malosRaulTmp);
    await seedAsistencias(cuadernoRaul, estudiantesRaul, malosRaulTmp);
    console.log('✅ Regeneración completa para 4to A');
  } else {
    console.log(`✅ 4to A ya tiene ${evalCount4to} evaluaciones y ${asisCount4to} asistencias`);
  }

const rodrigo = await User.findOne({ email: 'rodi@gmail.com' });
  if (!rodrigo) {
    console.warn('⚠️  No se encontró docente rodi@gmail.com. Saltando creación para Rodrigo.');
  } else {
    
    let curso6to = await Curso.findOne({ grado: '6to', paralelo: 'A', nivel: 'secundaria' });
    if (!curso6to) {
      curso6to = await Curso.create({
        grado: '6to', paralelo: 'A', nivel: 'secundaria', turno: 'mañana', docente: rodrigo._id, gestion: 2026, estudiantes: []
      });
      console.log('📚 Curso 6to A creado');
    } else {
      if (!curso6to.docente || String(curso6to.docente) !== String(rodrigo._id)) {
        curso6to.docente = rodrigo._id;
        await curso6to.save();
      }
      console.log(`📚 Curso 6to A encontrado: ${curso6to._id}`);
    }

    let materiaCiencia = await Materia.findOne({ nombre: 'Ciencia', grado: '6to', nivel: 'secundaria' });
    if (!materiaCiencia) {
      materiaCiencia = await Materia.create({
        nombre: 'Ciencia',
        area: 'Ciencia, Tecnología y Producción',
        nivel: 'secundaria',
        grado: '6to',
        docenteAsignado: rodrigo._id,
      });
      console.log('📖 Materia Ciencia 6to creada');
    } else {
      if (!materiaCiencia.docenteAsignado || String(materiaCiencia.docenteAsignado) !== String(rodrigo._id)) {
        materiaCiencia.docenteAsignado = rodrigo._id;
        await materiaCiencia.save();
      }
      console.log(`📖 Materia Ciencia encontrada: ${materiaCiencia._id}`);
    }

    const estudiantesRod = await asegurarEstudiantes(curso6to, 10, rodrigo._id);
    console.log(`👥 Estudiantes en 6to A: ${estudiantesRod.length}`);

    let cuadernoRod = await CuadernoPedagogico.findOne({ docente: rodrigo._id, curso: curso6to._id, materia: materiaCiencia._id });
    if (!cuadernoRod) {
      cuadernoRod = await CuadernoPedagogico.create({
        departamento: 'La Paz',
        distritoEducativo: 'La Paz 1',
        unidadEducativa: 'Unidad Educativa Central',
        director: 'Lic. María Torres',
        docente: rodrigo._id,
        curso: curso6to._id,
        materia: materiaCiencia._id,
        nivel: 'secundaria',
        gestion: 2026,
      });
      console.log('📋 Cuaderno pedagógico de Rodrigo creado');
    } else {
      console.log(`📋 Cuaderno de Rodrigo encontrado: ${cuadernoRod._id}`);
    }

    for (const estId of estudiantesRod) {
      const exists = await Inscripcion.findOne({ cuaderno: cuadernoRod._id, estudiante: estId });
      if (!exists) await Inscripcion.create({ cuaderno: cuadernoRod._id, estudiante: estId, registradoPor: rodrigo._id });
    }
    console.log('✅ Inscripciones de Rodrigo verificadas');

    const malosRod = [0, 1, 2, 3]; 
    await seedEvaluaciones(cuadernoRod, estudiantesRod, malosRod);
    await seedAsistencias(cuadernoRod, estudiantesRod, malosRod);
    console.log('✅ Evaluaciones y asistencias de Rodrigo generadas (6to A)\n');
  }

  const todosLosCuadernos = await CuadernoPedagogico.find({ _id: { $ne: cuadernoRaul._id } })
    .populate('curso')
    .lean();

  console.log(`📦 Procesando ${todosLosCuadernos.length} cuadernos adicionales...`);

  for (const cuad of todosLosCuadernos) {
    if (!cuad.curso) {
      console.log(`  ⚠️  Cuaderno ${cuad._id} sin curso — omitiendo`);
      continue;
    }

    const cursoDB = await Curso.findById(cuad.curso._id);
    if (!cursoDB) continue;

    const estIds = cursoDB.estudiantes || [];
    if (estIds.length === 0) {
      console.log(`  ⚠️  Curso ${cursoDB.grado} ${cursoDB.paralelo} sin estudiantes — omitiendo`);
      continue;
    }

    const cantidadMalos = rndInt(3, Math.min(4, estIds.length - 1));
    const indicesMalos  = [];
    while (indicesMalos.length < cantidadMalos) {
      const idx = rndInt(0, estIds.length - 1);
      if (!indicesMalos.includes(idx)) indicesMalos.push(idx);
    }

    const cuadernoDoc = await CuadernoPedagogico.findById(cuad._id);
    await seedEvaluaciones(cuadernoDoc, estIds, indicesMalos);
    await seedAsistencias(cuadernoDoc, estIds, indicesMalos);

    console.log(`  ✅ ${cursoDB.grado} "${cursoDB.paralelo}" — ${estIds.length} estudiantes, ${cantidadMalos} con riesgo`);
  }

  console.log('\n🎉 Script completado exitosamente!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
