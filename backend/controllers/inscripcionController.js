// ============================================
// controllers/inscripcionController.js — Gestión de Inscripciones
// ============================================
//
// RUTAS:
//   POST   /api/inscripciones              → Inscribir estudiante a un cuaderno
//   GET    /api/inscripciones?cuaderno=xxx → Obtener inscritos de un cuaderno
//   DELETE /api/inscripciones/:id          → Eliminar inscripción

const Inscripcion = require('../models/Inscripcion');
const Student = require('../models/Student');

// INSCRIBIR un estudiante a un cuaderno — POST /api/inscripciones
const inscribirEstudiante = async (req, res) => {
  try {
    const { cuaderno, estudiante } = req.body;

    if (!cuaderno || !estudiante) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Se requieren cuaderno y estudiante',
      });
    }

    const inscripcion = await Inscripcion.create({
      cuaderno,
      estudiante,
      registradoPor: req.usuario.id,
    });

    // Poblar datos del estudiante para devolverlos
    const inscripcionPoblada = await Inscripcion.findById(inscripcion._id)
      .populate('estudiante', 'nombres apellidos rude ci');

    res.status(201).json({
      exito: true,
      mensaje: 'Estudiante inscrito exitosamente',
      data: inscripcionPoblada,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El estudiante ya está inscrito en esta materia',
      });
    }
    console.error('Error en inscribirEstudiante:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER inscritos de un cuaderno — GET /api/inscripciones?cuaderno=xxx
const obtenerInscritos = async (req, res) => {
  try {
    const { cuaderno } = req.query;

    if (!cuaderno) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Se requiere el parámetro cuaderno',
      });
    }

    const inscripciones = await Inscripcion.find({ cuaderno })
      .populate('estudiante', 'nombres apellidos rude ci sexo')
      .sort({ 'estudiante.apellidos': 1 });

    // Ordenar por apellidos del estudiante
    const ordenadas = inscripciones.sort((a, b) => {
      const apA = a.estudiante?.apellidos || '';
      const apB = b.estudiante?.apellidos || '';
      return apA.localeCompare(apB);
    });

    res.json({
      exito: true,
      cantidad: ordenadas.length,
      data: ordenadas,
    });
  } catch (error) {
    console.error('Error en obtenerInscritos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ELIMINAR inscripción — DELETE /api/inscripciones/:id
const eliminarInscripcion = async (req, res) => {
  try {
    const inscripcion = await Inscripcion.findByIdAndDelete(req.params.id);

    if (!inscripcion) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Inscripción no encontrada',
      });
    }

    res.json({
      exito: true,
      mensaje: 'Inscripción eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error en eliminarInscripcion:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  inscribirEstudiante,
  obtenerInscritos,
  eliminarInscripcion,
};
