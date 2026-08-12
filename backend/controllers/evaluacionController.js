// ============================================
// controllers/evaluacionController.js — Gestión de Evaluaciones
// ============================================

const Evaluacion = require('../models/Evaluacion');

// REGISTRAR evaluación de un estudiante — POST /api/evaluaciones
const registrarEvaluacion = async (req, res) => {
  try {
    const { cuaderno, trimestre, estudiante, ser, saber, hacer, autoevaluacion, observaciones } = req.body;

    const evaluacion = await Evaluacion.create({
      cuaderno,
      trimestre,
      estudiante,
      ser: ser || 0,
      saber: saber || 0,
      hacer: hacer || 0,
      autoevaluacion: autoevaluacion || 0,
      observaciones,
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Evaluación registrada exitosamente',
      data: evaluacion,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe una evaluación para ese estudiante en ese trimestre y cuaderno',
      });
    }
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en registrarEvaluacion:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// REGISTRAR evaluaciones en lote (todos los estudiantes de un curso)
// POST /api/evaluaciones/lote
const registrarEvaluacionesLote = async (req, res) => {
  try {
    const { cuaderno, trimestre, evaluaciones } = req.body;
    // evaluaciones = [{ estudiante, ser, saber, hacer, autoevaluacion }, ...]

    const resultados = [];
    const errores = [];

    for (const item of evaluaciones) {
      try {
        // Intentar crear o actualizar (upsert)
        const evaluacion = await Evaluacion.findOneAndUpdate(
          { cuaderno, trimestre, estudiante: item.estudiante },
          {
            ser: item.ser || 0,
            saber: item.saber || 0,
            hacer: item.hacer || 0,
            autoevaluacion: item.autoevaluacion || 0,
            total: (item.ser || 0) + (item.saber || 0) + (item.hacer || 0) + (item.autoevaluacion || 0),
            observaciones: item.observaciones || '',
          },
          { upsert: true, new: true, runValidators: true }
        );
        resultados.push(evaluacion);
      } catch (err) {
        errores.push({ estudiante: item.estudiante, error: err.message });
      }
    }

    res.status(201).json({
      exito: true,
      mensaje: `${resultados.length} evaluaciones procesadas, ${errores.length} errores`,
      data: resultados,
      errores: errores.length > 0 ? errores : undefined,
    });
  } catch (error) {
    console.error('Error en registrarEvaluacionesLote:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER evaluaciones por cuaderno y trimestre — GET /api/evaluaciones
const obtenerEvaluaciones = async (req, res) => {
  try {
    const { cuaderno, trimestre } = req.query;
    const filtro = {};
    if (cuaderno) filtro.cuaderno = cuaderno;
    if (trimestre) filtro.trimestre = Number(trimestre);

    const evaluaciones = await Evaluacion.find(filtro)
      .populate('estudiante', 'nombres apellidos rude')
      .sort({ 'estudiante.apellidos': 1 });

    res.json({ exito: true, cantidad: evaluaciones.length, data: evaluaciones });
  } catch (error) {
    console.error('Error en obtenerEvaluaciones:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// CENTRALIZADOR — Resumen de notas de todos los estudiantes
// GET /api/evaluaciones/centralizador?cuaderno=xxx&trimestre=1
const centralizador = async (req, res) => {
  try {
    const { cuaderno, trimestre } = req.query;

    if (!cuaderno) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Se requiere el parámetro cuaderno',
      });
    }

    const filtro = { cuaderno };
    if (trimestre) filtro.trimestre = Number(trimestre);

    const evaluaciones = await Evaluacion.find(filtro)
      .populate('estudiante', 'nombres apellidos rude')
      .sort({ trimestre: 1 });

    // Agrupar por estudiante
    const centralizadorData = {};
    evaluaciones.forEach((ev) => {
      const estId = ev.estudiante._id.toString();
      if (!centralizadorData[estId]) {
        centralizadorData[estId] = {
          estudiante: ev.estudiante,
          trimestres: {},
        };
      }
      centralizadorData[estId].trimestres[ev.trimestre] = {
        ser: ev.ser,
        saber: ev.saber,
        hacer: ev.hacer,
        autoevaluacion: ev.autoevaluacion,
        total: ev.total,
      };
    });

    // Calcular promedio anual para cada estudiante
    Object.values(centralizadorData).forEach((item) => {
      const trims = Object.values(item.trimestres);
      if (trims.length > 0) {
        item.promedioAnual = Math.round(
          trims.reduce((sum, t) => sum + t.total, 0) / trims.length
        );
      }
    });

    res.json({
      exito: true,
      data: Object.values(centralizadorData),
    });
  } catch (error) {
    console.error('Error en centralizador:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ACTUALIZAR evaluación — PUT /api/evaluaciones/:id
const actualizarEvaluacion = async (req, res) => {
  try {
    const { ser, saber, hacer, autoevaluacion, observaciones } = req.body;

    const evaluacion = await Evaluacion.findById(req.params.id);
    if (!evaluacion) {
      return res.status(404).json({ exito: false, mensaje: 'Evaluación no encontrada' });
    }

    // Actualizar solo los campos enviados
    if (ser !== undefined) evaluacion.ser = ser;
    if (saber !== undefined) evaluacion.saber = saber;
    if (hacer !== undefined) evaluacion.hacer = hacer;
    if (autoevaluacion !== undefined) evaluacion.autoevaluacion = autoevaluacion;
    if (observaciones !== undefined) evaluacion.observaciones = observaciones;

    // El total se recalcula automáticamente en el pre-save
    await evaluacion.save();

    res.json({
      exito: true,
      mensaje: 'Evaluación actualizada exitosamente',
      data: evaluacion,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en actualizarEvaluacion:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ELIMINAR evaluación — DELETE /api/evaluaciones/:id
const eliminarEvaluacion = async (req, res) => {
  try {
    const evaluacion = await Evaluacion.findByIdAndDelete(req.params.id);
    if (!evaluacion) {
      return res.status(404).json({ exito: false, mensaje: 'Evaluación no encontrada' });
    }
    res.json({ exito: true, mensaje: 'Evaluación eliminada exitosamente' });
  } catch (error) {
    console.error('Error en eliminarEvaluacion:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  registrarEvaluacion,
  registrarEvaluacionesLote,
  obtenerEvaluaciones,
  centralizador,
  actualizarEvaluacion,
  eliminarEvaluacion,
};
