// ============================================================
// backend/controllers/mlController.js
// ============================================================
//
// PROPÓSITO:
//   Expone los resultados del motor ML como endpoints REST.
//   Todas las respuestas siguen el formato estándar del sistema:
//   { exito, mensaje, data }
//
// ENDPOINTS:
//   GET /api/ml/predicciones/estudiantes
//   GET /api/ml/predicciones/estudiantes/:id
//   GET /api/ml/predicciones/cursos
//   GET /api/ml/predicciones/cursos/:id
//   GET /api/ml/resumen
// ============================================================

'use strict';

const mlEngine = require('../ml/mlEngine');

// ── Helper de respuesta ───────────────────────────────────────
const ok  = (res, data, mensaje = 'OK', status = 200) =>
  res.status(status).json({ exito: true, mensaje, data });

const err = (res, mensaje, status = 500) =>
  res.status(status).json({ exito: false, mensaje });

// ── Extraer filtros de query params ───────────────────────────
function extraerFiltros(query) {
  const filtros = {};
  if (query.cursoId)   filtros.cursoId   = query.cursoId;
  if (query.materiaId) filtros.materiaId = query.materiaId;
  if (query.trimestre) filtros.trimestre = query.trimestre;
  if (query.gestion)   filtros.gestion   = query.gestion;
  return filtros;
}

// ============================================================
// GET /api/ml/predicciones/estudiantes
// Params opcionales: ?cursoId=&materiaId=&trimestre=&riesgo=
// ============================================================
exports.getPrediccionesEstudiantes = async (req, res) => {
  try {
    const filtros = extraerFiltros(req.query);
    let predicciones = await mlEngine.getPrediccionesEstudiantes(filtros);

    // Filtro adicional por nivel de riesgo (post-cálculo)
    if (req.query.riesgo) {
      predicciones = predicciones.filter(
        (p) => p.riesgo_academico === req.query.riesgo
      );
    }

    if (predicciones.length === 0) {
      return ok(res, { predicciones: [], total: 0 },
        'No hay datos suficientes para generar predicciones. ' +
        'Registra evaluaciones y asistencias primero.');
    }

    return ok(res, {
      predicciones,
      total: predicciones.length,
    }, `${predicciones.length} predicciones generadas`);

  } catch (error) {
    console.error('[ML] Error en getPrediccionesEstudiantes:', error);
    return err(res, 'Error al calcular predicciones: ' + error.message);
  }
};

// ============================================================
// GET /api/ml/predicciones/estudiantes/:id
// ============================================================
exports.getPrediccionEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const filtros = extraerFiltros(req.query);
    const predicciones = await mlEngine.getPrediccionEstudiante(id, filtros);

    if (predicciones.length === 0) {
      return err(res,
        `No se encontraron predicciones para el estudiante ${id}. ` +
        'Verifica que tiene evaluaciones y asistencias registradas.',
        404
      );
    }

    // Calcular resumen consolidado del estudiante
    const peso = { alto: 3, medio: 2, bajo: 1 };
    const peorRiesgo = predicciones.reduce((prev, curr) =>
      peso[curr.riesgo_academico] > peso[prev.riesgo_academico] ? curr : prev
    );

    const promedio = parseFloat(
      (predicciones.reduce((s, p) => s + p.total_trimestre, 0) / predicciones.length).toFixed(2)
    );
    const pctAs = parseFloat(
      (predicciones.reduce((s, p) => s + p.porcentaje_asistencia, 0) / predicciones.length).toFixed(2)
    );

    const todasAlerts = [...new Set(predicciones.flatMap((p) => p.alertas))];

    return ok(res, {
      estudiante: {
        id:     predicciones[0].estudiante_id,
        nombre: predicciones[0].estudiante.nombre,
        rude:   predicciones[0].estudiante.rude,
        curso:  predicciones[0].curso,
      },
      prediccion: {
        riesgo_academico:      peorRiesgo.riesgo_academico,
        nota_final_estimada:   peorRiesgo.nota_final_estimada,
        promedio_actual:       promedio,
        porcentaje_asistencia: pctAs,
        alertas:               todasAlerts,
      },
      detalle_por_materia: predicciones.map((p) => ({
        materia:              p.materia,
        trimestre:            p.trimestre,
        total_trimestre:      p.total_trimestre,
        nota_final_estimada:  p.nota_final_estimada,
        porcentaje_asistencia: p.porcentaje_asistencia,
        riesgo_academico:     p.riesgo_academico,
        alertas:              p.alertas,
      })),
    }, 'Predicción calculada');

  } catch (error) {
    console.error('[ML] Error en getPrediccionEstudiante:', error);
    return err(res, 'Error al calcular predicción: ' + error.message);
  }
};

// ============================================================
// GET /api/ml/predicciones/cursos
// ============================================================
exports.getPrediccionesCursos = async (req, res) => {
  try {
    const filtros = extraerFiltros(req.query);
    const cursos = await mlEngine.getPrediccionesCursos(filtros);

    if (cursos.length === 0) {
      return ok(res, { cursos: [], total: 0 },
        'No hay datos suficientes para analizar cursos.');
    }

    return ok(res, {
      cursos,
      total: cursos.length,
    }, `${cursos.length} cursos analizados`);

  } catch (error) {
    console.error('[ML] Error en getPrediccionesCursos:', error);
    return err(res, 'Error al calcular predicciones de cursos: ' + error.message);
  }
};

// ============================================================
// GET /api/ml/predicciones/cursos/:id
// ============================================================
exports.getPrediccionCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const filtros = { ...extraerFiltros(req.query), cursoId: id };
    const cursos  = await mlEngine.getPrediccionesCursos(filtros);

    if (cursos.length === 0) {
      return err(res,
        `No se encontraron predicciones para el curso ${id}.`,
        404
      );
    }

    return ok(res, cursos[0], 'Predicción de curso calculada');

  } catch (error) {
    console.error('[ML] Error en getPrediccionCurso:', error);
    return err(res, 'Error al calcular predicción del curso: ' + error.message);
  }
};

// ============================================================
// GET /api/ml/resumen
// ============================================================
exports.getResumen = async (req, res) => {
  try {
    const filtros = extraerFiltros(req.query);
    const resumen = await mlEngine.getResumenGlobal(filtros);

    if (!resumen.hay_datos) {
      return ok(res, resumen,
        'No hay evaluaciones registradas. El resumen estará disponible ' +
        'cuando se registren notas y asistencias.');
    }

    return ok(res, resumen, 'Resumen ML generado');

  } catch (error) {
    console.error('[ML] Error en getResumen:', error);
    return err(res, 'Error al generar resumen: ' + error.message);
  }
};
