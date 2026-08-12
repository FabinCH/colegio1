// ============================================
// controllers/asistenciaController.js — Gestión de Asistencia
// ============================================

const Asistencia = require('../models/Asistencia');

// REGISTRAR asistencia diaria — POST /api/asistencia
const registrarAsistencia = async (req, res) => {
  try {
    const { cuaderno, trimestre, fecha, registros } = req.body;

    const asistencia = await Asistencia.create({
      cuaderno,
      trimestre,
      fecha: fecha || new Date(),
      registros,
      registradoPor: req.usuario.id,
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Asistencia registrada exitosamente',
      data: asistencia,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya se registró asistencia para ese cuaderno en esa fecha',
      });
    }
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en registrarAsistencia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER asistencia por cuaderno y trimestre — GET /api/asistencia
const obtenerAsistencia = async (req, res) => {
  try {
    const { cuaderno, trimestre } = req.query;
    const filtro = {};
    if (cuaderno) filtro.cuaderno = cuaderno;
    if (trimestre) filtro.trimestre = trimestre;

    const asistencias = await Asistencia.find(filtro)
      .populate('registros.estudiante', 'nombres apellidos rude')
      .sort({ fecha: -1 });

    res.json({ exito: true, cantidad: asistencias.length, data: asistencias });
  } catch (error) {
    console.error('Error en obtenerAsistencia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ACTUALIZAR asistencia de un día — PUT /api/asistencia/:id
const actualizarAsistencia = async (req, res) => {
  try {
    const asistencia = await Asistencia.findByIdAndUpdate(
      req.params.id,
      { registros: req.body.registros },
      { new: true, runValidators: true }
    );

    if (!asistencia) {
      return res.status(404).json({ exito: false, mensaje: 'Registro de asistencia no encontrado' });
    }

    res.json({
      exito: true,
      mensaje: 'Asistencia actualizada exitosamente',
      data: asistencia,
    });
  } catch (error) {
    console.error('Error en actualizarAsistencia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// RESUMEN de asistencia por trimestre — GET /api/asistencia/resumen
const resumenAsistencia = async (req, res) => {
  try {
    const { cuaderno, trimestre } = req.query;

    if (!cuaderno || !trimestre) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Se requiere cuaderno y trimestre como parámetros',
      });
    }

    const asistencias = await Asistencia.find({
      cuaderno,
      trimestre: Number(trimestre),
    }).populate('registros.estudiante', 'nombres apellidos rude');

    // Calcular resumen por estudiante
    const resumen = {};
    asistencias.forEach((dia) => {
      dia.registros.forEach((reg) => {
        const estId = reg.estudiante._id.toString();
        if (!resumen[estId]) {
          resumen[estId] = {
            estudiante: reg.estudiante,
            A: 0, R: 0, L: 0, F: 0,
            totalDias: 0,
          };
        }
        resumen[estId][reg.valor]++;
        resumen[estId].totalDias++;
      });
    });

    res.json({
      exito: true,
      trimestre: Number(trimestre),
      diasRegistrados: asistencias.length,
      data: Object.values(resumen),
    });
  } catch (error) {
    console.error('Error en resumenAsistencia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ELIMINAR asistencia — DELETE /api/asistencia/:id
const eliminarAsistencia = async (req, res) => {
  try {
    const asistencia = await Asistencia.findByIdAndDelete(req.params.id);
    if (!asistencia) {
      return res.status(404).json({ exito: false, mensaje: 'Registro no encontrado' });
    }
    res.json({ exito: true, mensaje: 'Registro de asistencia eliminado' });
  } catch (error) {
    console.error('Error en eliminarAsistencia:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  registrarAsistencia,
  obtenerAsistencia,
  actualizarAsistencia,
  resumenAsistencia,
  eliminarAsistencia,
};
