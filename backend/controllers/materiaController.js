// ============================================
// controllers/materiaController.js — CRUD de Materias
// ============================================

const Materia = require('../models/Materia');

// CREAR materia — POST /api/materias
const crearMateria = async (req, res) => {
  try {
    const materia = await Materia.create(req.body);
    res.status(201).json({
      exito: true,
      mensaje: 'Materia creada exitosamente',
      data: materia,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe esa materia para el mismo nivel y grado',
      });
    }
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en crearMateria:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER todas las materias — GET /api/materias
const obtenerMaterias = async (req, res) => {
  try {
    // Filtrar por nivel y/o grado si se envían como query params
    // Ejemplo: GET /api/materias?nivel=secundaria&grado=4to
    const filtro = {};
    if (req.query.nivel) filtro.nivel = req.query.nivel;
    if (req.query.grado) filtro.grado = req.query.grado;

    const materias = await Materia.find(filtro).sort({ nombre: 1 });
    res.json({ exito: true, cantidad: materias.length, data: materias });
  } catch (error) {
    console.error('Error en obtenerMaterias:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER una materia por ID — GET /api/materias/:id
const obtenerMateria = async (req, res) => {
  try {
    const materia = await Materia.findById(req.params.id);
    if (!materia) {
      return res.status(404).json({ exito: false, mensaje: 'Materia no encontrada' });
    }
    res.json({ exito: true, data: materia });
  } catch (error) {
    console.error('Error en obtenerMateria:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ACTUALIZAR materia — PUT /api/materias/:id
const actualizarMateria = async (req, res) => {
  try {
    const materia = await Materia.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!materia) {
      return res.status(404).json({ exito: false, mensaje: 'Materia no encontrada' });
    }
    res.json({ exito: true, mensaje: 'Materia actualizada exitosamente', data: materia });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en actualizarMateria:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ELIMINAR materia — DELETE /api/materias/:id
const eliminarMateria = async (req, res) => {
  try {
    const materia = await Materia.findByIdAndDelete(req.params.id);
    if (!materia) {
      return res.status(404).json({ exito: false, mensaje: 'Materia no encontrada' });
    }
    res.json({ exito: true, mensaje: 'Materia eliminada exitosamente' });
  } catch (error) {
    console.error('Error en eliminarMateria:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  crearMateria,
  obtenerMaterias,
  obtenerMateria,
  actualizarMateria,
  eliminarMateria,
};
