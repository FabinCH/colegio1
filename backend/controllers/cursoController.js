// ============================================
// controllers/cursoController.js — CRUD de Cursos/Paralelos
// ============================================

const Curso = require('../models/Curso');

// CREAR curso — POST /api/cursos
const crearCurso = async (req, res) => {
  try {
    const curso = await Curso.create({
      ...req.body,
      docente: req.body.docente || req.usuario.id,
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Curso creado exitosamente',
      data: curso,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un curso con ese grado, paralelo, turno y gestión',
      });
    }
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en crearCurso:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER todos los cursos — GET /api/cursos
const obtenerCursos = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.gestion) filtro.gestion = req.query.gestion;
    if (req.query.nivel) filtro.nivel = req.query.nivel;
    if (req.query.docente) filtro.docente = req.query.docente;

    const cursos = await Curso.find(filtro)
      .populate('docente', 'nombre email') // Trae nombre y email del docente
      .populate('estudiantes', 'nombres apellidos rude') // Trae datos básicos de estudiantes
      .sort({ grado: 1, paralelo: 1 });

    res.json({ exito: true, cantidad: cursos.length, data: cursos });
  } catch (error) {
    console.error('Error en obtenerCursos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER un curso por ID — GET /api/cursos/:id
const obtenerCurso = async (req, res) => {
  try {
    const curso = await Curso.findById(req.params.id)
      .populate('docente', 'nombre email')
      .populate('estudiantes', 'nombres apellidos rude ci');

    if (!curso) {
      return res.status(404).json({ exito: false, mensaje: 'Curso no encontrado' });
    }
    res.json({ exito: true, data: curso });
  } catch (error) {
    console.error('Error en obtenerCurso:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ACTUALIZAR curso — PUT /api/cursos/:id
const actualizarCurso = async (req, res) => {
  try {
    const curso = await Curso.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!curso) {
      return res.status(404).json({ exito: false, mensaje: 'Curso no encontrado' });
    }
    res.json({ exito: true, mensaje: 'Curso actualizado exitosamente', data: curso });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en actualizarCurso:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// AGREGAR estudiante a un curso — POST /api/cursos/:id/estudiantes
const agregarEstudiante = async (req, res) => {
  try {
    const { estudianteId } = req.body;
    const curso = await Curso.findById(req.params.id);

    if (!curso) {
      return res.status(404).json({ exito: false, mensaje: 'Curso no encontrado' });
    }

    // Verificar que el estudiante no esté ya en el curso
    if (curso.estudiantes.includes(estudianteId)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El estudiante ya está inscrito en este curso',
      });
    }

    curso.estudiantes.push(estudianteId);
    await curso.save();

    res.json({
      exito: true,
      mensaje: 'Estudiante agregado al curso exitosamente',
      data: curso,
    });
  } catch (error) {
    console.error('Error en agregarEstudiante:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ELIMINAR curso — DELETE /api/cursos/:id
const eliminarCurso = async (req, res) => {
  try {
    const curso = await Curso.findByIdAndDelete(req.params.id);
    if (!curso) {
      return res.status(404).json({ exito: false, mensaje: 'Curso no encontrado' });
    }
    res.json({ exito: true, mensaje: 'Curso eliminado exitosamente' });
  } catch (error) {
    console.error('Error en eliminarCurso:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  crearCurso,
  obtenerCursos,
  obtenerCurso,
  actualizarCurso,
  agregarEstudiante,
  eliminarCurso,
};
