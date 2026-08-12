// ============================================================
// backend/ml/scripts/generar_dataset.js  (v2 — columnas enriquecidas)
// ============================================================
//
// PROPÓSITO:
//   Lee datos reales de MongoDB y genera un archivo CSV listo
//   para entrenar modelos de Machine Learning que predigan el
//   riesgo académico de los estudiantes.
//
// COLUMNAS GENERADAS:
//   estudiante_id, curso_id, curso, materia_id, materia,
//   gestion, trimestre, ser, saber, hacer, autoevaluacion,
//   total_trimestre, promedio_anterior, promedio_parcial,
//   variacion_promedio, asistencias, faltas, retrasos,
//   licencias, porcentaje_asistencia, materias_bajo_rendimiento,
//   riesgo_academico, nota_final_estimada
//
// USO:
//   node ml/scripts/generar_dataset.js      (desde backend/)
//   npm run ml:dataset                      (desde backend/)
// ============================================================

'use strict';

const path   = require('path');
const fs     = require('fs');

// Cargar .env desde backend/
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');

// ── Modelos ───────────────────────────────────────────────────
const Evaluacion         = require('../../models/Evaluacion');
const Asistencia         = require('../../models/Asistencia');
const CuadernoPedagogico = require('../../models/CuadernoPedagogico');
const Curso              = require('../../models/Curso');
const Materia            = require('../../models/Materia');
const Student            = require('../../models/Student');

// ── Rutas de salida ───────────────────────────────────────────
const OUTPUT_DIR  = path.resolve(__dirname, '../datasets');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'dataset_rendimiento_estudiantil.csv');

// ── Encabezados CSV ───────────────────────────────────────────
const CSV_HEADERS = [
  'estudiante_id',
  'curso_id',
  'curso',
  'materia_id',
  'materia',
  'gestion',
  'trimestre',
  'ser',
  'saber',
  'hacer',
  'autoevaluacion',
  'total_trimestre',
  'promedio_anterior',
  'promedio_parcial',
  'variacion_promedio',
  'asistencias',
  'faltas',
  'retrasos',
  'licencias',
  'porcentaje_asistencia',
  'materias_bajo_rendimiento',
  'riesgo_academico',
  'nota_final_estimada',
];

// ── Helpers ───────────────────────────────────────────────────

function escaparCSV(valor) {
  const str = (valor === null || valor === undefined) ? '' : String(valor);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function filaACSV(obj) {
  return CSV_HEADERS.map((col) => escaparCSV(obj[col])).join(',');
}

/**
 * Clasifica el riesgo académico según reglas calibradas.
 * alto  → total < 51  O  asistencia < 60
 * medio → total < 65  O  asistencia < 75
 * bajo  → cualquier otro caso
 */
function calcularRiesgo(total, pctAsistencia) {
  if (total < 51 || pctAsistencia < 60) return 'alto';
  if (total < 65 || pctAsistencia < 75) return 'medio';
  return 'bajo';
}

/**
 * Proyecta la nota final estimada usando la tendencia histórica.
 *
 * Fórmula:
 *   - Si hay promedio_anterior: nota_final = (total + promedio_anterior) / 2 + ajuste_asistencia
 *   - Si solo hay trimestre actual: nota_final = total + ajuste_asistencia
 *   - Ajuste por asistencia: -0.05 por cada punto debajo de 85%
 *
 * El resultado se clamp entre 0 y 100.
 */
function proyectarNotaFinal(total, promedioAnterior, pctAsistencia) {
  const base =
    promedioAnterior !== null
      ? (total + promedioAnterior) / 2
      : total;

  // Penalización por baja asistencia (máx -10 puntos)
  const penalizacion = Math.max(0, Math.min(10, (85 - pctAsistencia) * 0.15));
  const estimada = Math.max(0, Math.min(100, Math.round(base - penalizacion)));
  return estimada;
}

function formatearCurso(curso) {
  if (!curso) return '';
  return [curso.grado, curso.paralelo, curso.nivel, curso.turno]
    .filter(Boolean)
    .join(' ');
}

// ── Función principal ─────────────────────────────────────────
async function generarDataset() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI no definida en .env');
    process.exit(1);
  }

  console.log('🔌 Conectando a MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Conexión exitosa\n');

  try {
    // ── 1. Cargar evaluaciones con populate ──────────────────
    console.log('📚 Leyendo evaluaciones...');
    const evaluaciones = await Evaluacion.find({})
      .populate({
        path: 'cuaderno',
        populate: [
          { path: 'curso',   model: 'Curso'   },
          { path: 'materia', model: 'Materia' },
        ],
      })
      .populate('estudiante', '_id nombres apellidos rude')
      .lean();
    console.log(`   → ${evaluaciones.length} evaluaciones encontradas`);

    // ── 2. Cargar asistencias y construir mapa ──────────────
    console.log('📋 Leyendo asistencias...');
    const todasAsistencias = await Asistencia.find({})
      .select('cuaderno trimestre registros')
      .lean();
    console.log(`   → ${todasAsistencias.length} registros de asistencia`);

    // Mapa: "cuadernoId_trimestre_estudianteId" → { A, F, R, L }
    const mapaAsistencia = new Map();
    for (const doc of todasAsistencias) {
      const cId = String(doc.cuaderno);
      for (const reg of doc.registros) {
        const eId  = String(reg.estudiante);
        const key  = `${cId}_${doc.trimestre}_${eId}`;
        if (!mapaAsistencia.has(key)) {
          mapaAsistencia.set(key, { A: 0, F: 0, R: 0, L: 0 });
        }
        const c = mapaAsistencia.get(key);
        if (c[reg.valor] !== undefined) c[reg.valor]++;
      }
    }

    // ── 3. Construir mapa de historial por estudiante+materia ──
    // Key: "estudianteId_cuadernoId" → { trimestre → total }
    const historialMap = new Map();
    for (const ev of evaluaciones) {
      if (!ev.cuaderno) continue;
      const key = `${String(ev.estudiante?._id || ev.estudiante)}_${String(ev.cuaderno._id)}`;
      if (!historialMap.has(key)) historialMap.set(key, {});
      historialMap.get(key)[ev.trimestre] = ev.total ?? 0;
    }

    // ── 4. Conteo de materias con bajo rendimiento por estudiante ──
    // "bajo rendimiento" = total_trimestre < 51
    // Agrupa por estudiante_id → cuenta cuadernos únicos con algún trimestre < 51
    const materiasBajoMap = new Map(); // estudianteId → Set de cuadernoId con bajo rendimiento
    for (const ev of evaluaciones) {
      if (!ev.cuaderno) continue;
      const eId = String(ev.estudiante?._id || ev.estudiante);
      const cId = String(ev.cuaderno._id);
      if ((ev.total ?? 0) < 51) {
        if (!materiasBajoMap.has(eId)) materiasBajoMap.set(eId, new Set());
        materiasBajoMap.get(eId).add(cId);
      }
    }

    // ── 5. Crear carpeta de salida ────────────────────────────
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`\n📁 Carpeta creada: ${OUTPUT_DIR}`);
    }

    // ── 6. Construir filas ────────────────────────────────────
    console.log('\n🔨 Construyendo dataset...');
    const lineas = [CSV_HEADERS.join(',')];
    let generadas = 0;
    let omitidas  = 0;

    for (const ev of evaluaciones) {
      const cuaderno = ev.cuaderno;
      if (!cuaderno || !cuaderno.curso || !cuaderno.materia) {
        omitidas++;
        continue;
      }

      const eId   = String(ev.estudiante?._id || ev.estudiante);
      const cId   = String(cuaderno._id);
      const curso = cuaderno.curso;
      const mat   = cuaderno.materia;

      // Asistencia
      const asKey  = `${cId}_${ev.trimestre}_${eId}`;
      const conteo = mapaAsistencia.get(asKey) || { A: 0, F: 0, R: 0, L: 0 };
      const totalReg = conteo.A + conteo.F + conteo.R + conteo.L;
      const pctAs  = totalReg > 0
        ? parseFloat(((conteo.A / totalReg) * 100).toFixed(2))
        : 0;

      // Notas
      const ser            = ev.ser            ?? 0;
      const saber          = ev.saber          ?? 0;
      const hacer          = ev.hacer          ?? 0;
      const autoevaluacion = ev.autoevaluacion ?? 0;
      const total          = ev.total          ?? (ser + saber + hacer + autoevaluacion);

      // Historial (promedio anterior y parcial)
      const histKey  = `${eId}_${cId}`;
      const hist     = historialMap.get(histKey) || {};
      const trimAnt  = ev.trimestre - 1;
      const promAnt  = hist[trimAnt] !== undefined ? hist[trimAnt] : null;

      // Promedio parcial: media de todos los trimestres disponibles hasta el actual
      const totalesHasta = Object.entries(hist)
        .filter(([t]) => parseInt(t) <= ev.trimestre)
        .map(([, v]) => v);
      const promParcial = totalesHasta.length > 0
        ? parseFloat((totalesHasta.reduce((a, b) => a + b, 0) / totalesHasta.length).toFixed(2))
        : total;

      // Variación
      const variacion = promAnt !== null
        ? parseFloat((total - promAnt).toFixed(2))
        : 0;

      // Materias con bajo rendimiento
      const matBajo = (materiasBajoMap.get(eId)?.size) ?? 0;

      // Riesgo y nota estimada
      const riesgo    = calcularRiesgo(total, pctAs);
      const notaFinal = proyectarNotaFinal(total, promAnt, pctAs);

      const fila = {
        estudiante_id:             eId,
        curso_id:                  String(curso._id),
        curso:                     formatearCurso(curso),
        materia_id:                String(mat._id),
        materia:                   mat.nombre || '',
        gestion:                   cuaderno.gestion ?? '',
        trimestre:                 ev.trimestre,
        ser,
        saber,
        hacer,
        autoevaluacion,
        total_trimestre:           total,
        promedio_anterior:         promAnt ?? '',
        promedio_parcial:          promParcial,
        variacion_promedio:        variacion,
        asistencias:               conteo.A,
        faltas:                    conteo.F,
        retrasos:                  conteo.R,
        licencias:                 conteo.L,
        porcentaje_asistencia:     pctAs,
        materias_bajo_rendimiento: matBajo,
        riesgo_academico:          riesgo,
        nota_final_estimada:       notaFinal,
      };

      lineas.push(filaACSV(fila));
      generadas++;
    }

    // ── 7. Escribir CSV ───────────────────────────────────────
    // '\ufeff' es el BOM de UTF-8 — necesario en Windows para
    // que Excel y otros programas lean correctamente los acentos
    fs.writeFileSync(OUTPUT_FILE, '\ufeff' + lineas.join('\n'), 'utf8');

    // ── 8. Resumen ────────────────────────────────────────────
    console.log('\n' + '='.repeat(58));
    console.log('📊 DATASET GENERADO EXITOSAMENTE');
    console.log('='.repeat(58));
    console.log(`   ✅ Filas generadas        : ${generadas}`);
    if (omitidas > 0) {
      console.log(`   ⚠️  Filas omitidas         : ${omitidas} (datos incompletos)`);
    }
    console.log(`   📄 Archivo               : ${OUTPUT_FILE}`);
    console.log(`   📋 Columnas              : ${CSV_HEADERS.length}`);
    console.log('='.repeat(58) + '\n');

  } finally {
    await mongoose.disconnect();
    console.log('🔌 Conexión a MongoDB cerrada.');
  }
}

generarDataset().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
