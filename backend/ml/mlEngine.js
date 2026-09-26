// ============================================================
// backend/ml/mlEngine.js — Motor de Predicción en Node.js
// ============================================================
//
// PROPÓSITO:
//   Calcula predicciones de riesgo académico y nota final
//   directamente desde MongoDB, sin necesidad de un servidor
//   Python en ejecución.
//
//   Este módulo actúa como FALLBACK siempre disponible.
//   Implementa las mismas reglas calibradas que el modelo
//   Python, con enriquecimiento histórico.
//
// EXPORTA:
//   getPrediccionesEstudiantes()  → array de predicciones
//   getPrediccionesCursos()       → array de resúmenes por curso
//   getResumenGlobal()            → totales del sistema
// ============================================================

'use strict';

const Evaluacion         = require('../models/Evaluacion');
const Asistencia         = require('../models/Asistencia');
const CuadernoPedagogico = require('../models/CuadernoPedagogico');
const Curso              = require('../models/Curso');
const Materia            = require('../models/Materia');
const Student            = require('../models/Student');

// ── Constantes de umbral ──────────────────────────────────────
const UMBRAL_REPROBACION    = 51;   // nota mínima para no reprobar
const UMBRAL_BAJO           = 65;   // nota mínima para riesgo bajo
const UMBRAL_AS_CRITICA     = 60;   // % asistencia crítica
const UMBRAL_AS_MEDIA       = 75;   // % asistencia media
const UMBRAL_AS_BUENA       = 85;   // % asistencia buena
const UMBRAL_CAIDA          = -10;  // puntos de caída para alerta

// ── Helpers internos ──────────────────────────────────────────

/**
 * Clasifica el nivel de riesgo académico.
 *  alto  → nota < 51 O asistencia < 60%
 *  medio → nota < 65 O asistencia < 75%
 *  bajo  → demás casos
 */
function clasificarRiesgo(total, pctAsistencia) {
  if (total < UMBRAL_REPROBACION || pctAsistencia < UMBRAL_AS_CRITICA)
    return 'alto';
  if (total < UMBRAL_BAJO || pctAsistencia < UMBRAL_AS_MEDIA)
    return 'medio';
  return 'bajo';
}

/**
 * Proyecta la nota final estimada al cierre de la gestión.
 * Usa la tendencia histórica + penalización por baja asistencia.
 */
function proyectarNotaFinal(total, promedioAnterior, pctAsistencia) {
  const base =
    promedioAnterior !== null
      ? (total + promedioAnterior) / 2
      : total;
  // Penalización: hasta -10 puntos si asistencia < 85%
  const penalizacion = Math.max(0, Math.min(10, (UMBRAL_AS_BUENA - pctAsistencia) * 0.15));
  return Math.max(0, Math.min(100, Math.round(base - penalizacion)));
}

/**
 * Genera el arreglo de alertas textuales para un estudiante.
 */
function generarAlertas(total, pctAsistencia, variacion, matBajo) {
  const alertas = [];
  if (total < UMBRAL_REPROBACION)
    alertas.push('Posible reprobación');
  if (pctAsistencia < UMBRAL_AS_CRITICA)
    alertas.push('Baja asistencia crítica');
  else if (pctAsistencia < UMBRAL_AS_MEDIA)
    alertas.push('Baja asistencia');
  if (variacion !== null && variacion <= UMBRAL_CAIDA)
    alertas.push('Caída de rendimiento');
  if (matBajo >= 2)
    alertas.push(`${matBajo} materias con bajo rendimiento`);
  return alertas;
}

function formatearCurso(curso) {
  if (!curso) return '';
  return [curso.grado, curso.paralelo, curso.nivel, curso.turno]
    .filter(Boolean).join(' ');
}

// ── Función principal de carga y cálculo ──────────────────────

/**
 * Lee MongoDB y devuelve todos los datos necesarios para predicciones.
 * Se pueden aplicar filtros opcionales (curso_id, materia_id, trimestre).
 *
 * @param {Object} filtros - { cursoId?, materiaId?, trimestre?, gestion? }
 * @returns {Promise<Array>} - array de objetos predicción por fila
 */
async function calcularPredicciones(filtros = {}) {
  // ── Filtros de Evaluacion ─────────────────────────────────
  const evalQuery = {};
  if (filtros.trimestre) evalQuery.trimestre = parseInt(filtros.trimestre);

  // ── Cargar evaluaciones ───────────────────────────────────
  const evaluaciones = await Evaluacion.find(evalQuery, 'cuaderno trimestre estudiante ser saber hacer autoevaluacion total')
    .populate({
      path: 'cuaderno',
      populate: [
        { path: 'curso',   model: 'Curso',   select: '_id grado paralelo nivel turno' },
        { path: 'materia', model: 'Materia',  select: '_id nombre area' },
      ],
    })
    .populate('estudiante', '_id nombres apellidos rude')
    .lean()
    .exec();

  // ── Filtrar por curso/materia si aplica ───────────────────
  const evFiltradas = evaluaciones.filter((ev) => {
    if (!ev.cuaderno) return false;
    if (filtros.cursoId   && String(ev.cuaderno.curso?._id)   !== filtros.cursoId)   return false;
    if (filtros.materiaId && String(ev.cuaderno.materia?._id) !== filtros.materiaId) return false;
    if (filtros.gestion   && ev.cuaderno.gestion !== parseInt(filtros.gestion))       return false;
    return true;
  });

  // ── Cargar asistencias ────────────────────────────────────
  const asistencias = await Asistencia.find({})
    .select('cuaderno trimestre registros').lean();

  // Mapa rápido de asistencia
  const mapaAs = new Map();
  for (const doc of asistencias) {
    const cId = String(doc.cuaderno);
    for (const reg of doc.registros) {
      const eId = String(reg.estudiante);
      const key = `${cId}_${doc.trimestre}_${eId}`;
      if (!mapaAs.has(key)) mapaAs.set(key, { A: 0, F: 0, R: 0, L: 0 });
      const c = mapaAs.get(key);
      if (c[reg.valor] !== undefined) c[reg.valor]++;
    }
  }

  // ── Historial de notas por estudiante+cuaderno ────────────
  const historial = new Map(); // key: "eId_cId" → { trimestre → total }
  for (const ev of evaluaciones) {
    if (!ev.cuaderno) continue;
    const key = `${String(ev.estudiante?._id || ev.estudiante)}_${String(ev.cuaderno._id)}`;
    if (!historial.has(key)) historial.set(key, {});
    historial.get(key)[ev.trimestre] = ev.total ?? 0;
  }

  // ── Materias con bajo rendimiento por estudiante ──────────
  const matBajoMap = new Map(); // eId → Set de cuadernoId
  for (const ev of evaluaciones) {
    if (!ev.cuaderno) continue;
    const eId = String(ev.estudiante?._id || ev.estudiante);
    const cId = String(ev.cuaderno._id);
    if ((ev.total ?? 0) < UMBRAL_REPROBACION) {
      if (!matBajoMap.has(eId)) matBajoMap.set(eId, new Set());
      matBajoMap.get(eId).add(cId);
    }
  }

  // ── Construir predicciones ────────────────────────────────
  const predicciones = [];

  for (const ev of evFiltradas) {
    const cuaderno  = ev.cuaderno;
    const curso     = cuaderno.curso;
    const materia   = cuaderno.materia;
    const estudiante = ev.estudiante;
    if (!curso || !materia || !estudiante) continue;

    const eId = String(estudiante._id || estudiante);
    const cId = String(cuaderno._id);

    // Asistencia
    const asKey  = `${cId}_${ev.trimestre}_${eId}`;
    const conteo = mapaAs.get(asKey) || { A: 0, F: 0, R: 0, L: 0 };
    const totalReg = conteo.A + conteo.F + conteo.R + conteo.L;
    const pctAs  = totalReg > 0
      ? parseFloat(((conteo.A / totalReg) * 100).toFixed(2))
      : 0;

    // Notas
    const ser            = ev.ser            ?? 0;
    const saber          = ev.saber          ?? 0;
    const hacer          = ev.hacer          ?? 0;
    const autoevaluacion = ev.autoevaluacion ?? 0;
    const total          = ev.total ?? (ser + saber + hacer + autoevaluacion);

    // Historial
    const hist    = historial.get(`${eId}_${cId}`) || {};
    const promAnt = hist[ev.trimestre - 1] !== undefined ? hist[ev.trimestre - 1] : null;

    const totalesHasta = Object.entries(hist)
      .filter(([t]) => parseInt(t) <= ev.trimestre)
      .map(([, v]) => v);
    const promParcial = totalesHasta.length > 0
      ? parseFloat((totalesHasta.reduce((a, b) => a + b, 0) / totalesHasta.length).toFixed(2))
      : total;

    const variacion = promAnt !== null ? parseFloat((total - promAnt).toFixed(2)) : null;
    const matBajo   = matBajoMap.get(eId)?.size ?? 0;

    // Predicciones
    const riesgo    = clasificarRiesgo(total, pctAs);
    const notaFinal = proyectarNotaFinal(total, promAnt, pctAs);
    const alertas   = generarAlertas(total, pctAs, variacion, matBajo);

    predicciones.push({
      // Identificadores
      estudiante_id:   eId,
      cuaderno_id:     cId,
      curso_id:        String(curso._id),
      materia_id:      String(materia._id),

      // Info descriptiva
      estudiante: {
        id:       eId,
        nombre:   `${estudiante.nombres} ${estudiante.apellidos}`.trim(),
        rude:     estudiante.rude || '',
      },
      curso:   formatearCurso(curso),
      materia: materia.nombre || '',
      gestion: cuaderno.gestion,
      trimestre: ev.trimestre,

      // Notas
      ser,
      saber,
      hacer,
      autoevaluacion,
      total_trimestre:  total,
      promedio_anterior: promAnt,
      promedio_parcial:  promParcial,
      variacion_promedio: variacion,

      // Asistencia
      asistencias:  conteo.A,
      faltas:       conteo.F,
      retrasos:     conteo.R,
      licencias:    conteo.L,
      porcentaje_asistencia: pctAs,

      // ML
      materias_bajo_rendimiento: matBajo,
      riesgo_academico:     riesgo,
      nota_final_estimada:  notaFinal,
      alertas,
    });
  }

  return predicciones;
}

// ── API pública del módulo ────────────────────────────────────

/**
 * Obtiene todas las predicciones con filtros opcionales.
 */
async function getPrediccionesEstudiantes(filtros = {}) {
  return calcularPredicciones(filtros);
}

/**
 * Obtiene la predicción de un único estudiante (todas sus materias/trimestres).
 */
async function getPrediccionEstudiante(estudianteId, filtros = {}) {
  const todas = await calcularPredicciones(filtros);
  return todas.filter((p) => p.estudiante_id === estudianteId);
}

/**
 * Agrupa predicciones por curso y devuelve un resumen por curso.
 */
async function getPrediccionesCursos(filtros = {}) {
  const predicciones = await calcularPredicciones(filtros);

  // Agrupar por curso_id
  const gruposCurso = new Map();

  for (const p of predicciones) {
    const key = p.curso_id;
    if (!gruposCurso.has(key)) {
      gruposCurso.set(key, {
        curso_id:  p.curso_id,
        curso:     p.curso,
        gestion:   p.gestion,
        estudiantes: new Map(), // eId → última predicción (peor riesgo)
        materias_riesgo: new Map(), // materia → conteo de riesgo_alto
      });
    }

    const g = gruposCurso.get(key);
    const eId = p.estudiante_id;

    // Guardar la predicción de peor riesgo por estudiante (en este curso)
    const peso = { alto: 3, medio: 2, bajo: 1 };
    if (!g.estudiantes.has(eId) ||
        peso[p.riesgo_academico] > peso[g.estudiantes.get(eId).riesgo_academico]) {
      g.estudiantes.set(eId, p);
    }

    // Conteo de riesgo por materia
    if (p.riesgo_academico === 'alto') {
      const m = p.materia;
      g.materias_riesgo.set(m, (g.materias_riesgo.get(m) || 0) + 1);
    }
  }

  // Convertir a array de resúmenes
  const resumen = [];
  for (const [, g] of gruposCurso) {
    const estArr = Array.from(g.estudiantes.values());

    const riesgoAlto  = estArr.filter((e) => e.riesgo_academico === 'alto').length;
    const riesgoMedio = estArr.filter((e) => e.riesgo_academico === 'medio').length;
    const riesgoBajo  = estArr.filter((e) => e.riesgo_academico === 'bajo').length;

    const promGeneral = estArr.length > 0
      ? parseFloat((estArr.reduce((s, e) => s + e.total_trimestre, 0) / estArr.length).toFixed(2))
      : 0;
    const promAs = estArr.length > 0
      ? parseFloat((estArr.reduce((s, e) => s + e.porcentaje_asistencia, 0) / estArr.length).toFixed(2))
      : 0;

    // Materias con más riesgo
    const materiasOrdenadas = Array.from(g.materias_riesgo.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nombre, cant]) => ({ nombre, estudiantes_riesgo_alto: cant }));

    resumen.push({
      curso_id: g.curso_id,
      curso:    g.curso,
      gestion:  g.gestion,
      resumen: {
        total_estudiantes:           estArr.length,
        riesgo_alto:                 riesgoAlto,
        riesgo_medio:                riesgoMedio,
        riesgo_bajo:                 riesgoBajo,
        promedio_general:            promGeneral,
        porcentaje_asistencia_promedio: promAs,
      },
      materias_con_mas_riesgo: materiasOrdenadas,
      estudiantes_riesgo: estArr
        .filter((e) => e.riesgo_academico !== 'bajo')
        .sort((a, b) => {
          const peso = { alto: 3, medio: 2, bajo: 1 };
          return peso[b.riesgo_academico] - peso[a.riesgo_academico];
        })
        .map((e) => ({
          nombre:              e.estudiante.nombre,
          rude:                e.estudiante.rude,
          riesgo_academico:    e.riesgo_academico,
          nota_final_estimada: e.nota_final_estimada,
          porcentaje_asistencia: e.porcentaje_asistencia,
          alertas:             e.alertas,
        })),
    });
  }

  // Ordenar por mayor riesgo
  return resumen.sort((a, b) => b.resumen.riesgo_alto - a.resumen.riesgo_alto);
}

/**
 * Retorna el resumen global del sistema ML.
 */
async function getResumenGlobal(filtros = {}) {
  const predicciones = await calcularPredicciones(filtros);

  if (predicciones.length === 0) {
    return {
      total_analizados:   0,
      riesgo_alto:        0,
      riesgo_medio:       0,
      riesgo_bajo:        0,
      promedio_general:   0,
      asistencia_promedio: 0,
      curso_mayor_riesgo: null,
      hay_datos:          false,
    };
  }

  // Agrupar por estudiante para el conteo global (evitar duplicados por materia)
  const porEstudiante = new Map();
  const peso = { alto: 3, medio: 2, bajo: 1 };

  for (const p of predicciones) {
    const eId = p.estudiante_id;
    if (!porEstudiante.has(eId) ||
        peso[p.riesgo_academico] > peso[porEstudiante.get(eId).riesgo_academico]) {
      porEstudiante.set(eId, p);
    }
  }

  const estArr = Array.from(porEstudiante.values());
  const total  = estArr.length;

  const alto  = estArr.filter((e) => e.riesgo_academico === 'alto').length;
  const medio = estArr.filter((e) => e.riesgo_academico === 'medio').length;
  const bajo  = estArr.filter((e) => e.riesgo_academico === 'bajo').length;

  const promG = parseFloat(
    (estArr.reduce((s, e) => s + e.total_trimestre, 0) / total).toFixed(2)
  );
  const promAs = parseFloat(
    (estArr.reduce((s, e) => s + e.porcentaje_asistencia, 0) / total).toFixed(2)
  );

  // Curso con mayor proporción de riesgo alto
  const cursos = await getPrediccionesCursos(filtros);
  const cursoMayorRiesgo = cursos.length > 0 ? cursos[0].curso : null;

  return {
    total_analizados:   total,
    riesgo_alto:        alto,
    riesgo_medio:       medio,
    riesgo_bajo:        bajo,
    promedio_general:   promG,
    asistencia_promedio: promAs,
    curso_mayor_riesgo: cursoMayorRiesgo,
    hay_datos:          true,
  };
}

module.exports = {
  getPrediccionesEstudiantes,
  getPrediccionEstudiante,
  getPrediccionesCursos,
  getResumenGlobal,
};
