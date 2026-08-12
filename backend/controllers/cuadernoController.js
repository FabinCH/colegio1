// ============================================
// controllers/cuadernoController.js — CRUD de Cuaderno Pedagógico
// ============================================

const CuadernoPedagogico = require('../models/CuadernoPedagogico');

// CREAR cuaderno — POST /api/cuadernos
const crearCuaderno = async (req, res) => {
  try {
    const cuaderno = await CuadernoPedagogico.create({
      ...req.body,
      docente: req.body.docente || req.usuario.id,
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Cuaderno pedagógico creado exitosamente',
      data: cuaderno,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un cuaderno para ese docente, curso, materia y gestión',
      });
    }
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en crearCuaderno:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER cuadernos del docente autenticado — GET /api/cuadernos
const obtenerCuadernos = async (req, res) => {
  try {
    const filtro = {};

    // Si es docente, solo ve sus propios cuadernos
    // Si es admin/director, ve todos (o puede filtrar por docente)
    if (req.usuario.rol === 'docente') {
      filtro.docente = req.usuario.id;
    } else if (req.query.docente) {
      filtro.docente = req.query.docente;
    }

    if (req.query.gestion) filtro.gestion = req.query.gestion;

    const cuadernos = await CuadernoPedagogico.find(filtro)
      .populate('docente', 'nombre email')
      .populate('curso', 'grado paralelo turno')
      .populate('materia', 'nombre area')
      .sort({ gestion: -1 });

    res.json({ exito: true, cantidad: cuadernos.length, data: cuadernos });
  } catch (error) {
    console.error('Error en obtenerCuadernos:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// OBTENER un cuaderno por ID — GET /api/cuadernos/:id
const obtenerCuaderno = async (req, res) => {
  try {
    const cuaderno = await CuadernoPedagogico.findById(req.params.id)
      .populate('docente', 'nombre email')
      .populate({
        path: 'curso',
        populate: { path: 'estudiantes', select: 'nombres apellidos rude' },
      })
      .populate('materia', 'nombre area grado');

    if (!cuaderno) {
      return res.status(404).json({ exito: false, mensaje: 'Cuaderno no encontrado' });
    }

    res.json({ exito: true, data: cuaderno });
  } catch (error) {
    console.error('Error en obtenerCuaderno:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ACTUALIZAR cuaderno — PUT /api/cuadernos/:id
const actualizarCuaderno = async (req, res) => {
  try {
    const cuaderno = await CuadernoPedagogico.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cuaderno) {
      return res.status(404).json({ exito: false, mensaje: 'Cuaderno no encontrado' });
    }
    res.json({ exito: true, mensaje: 'Cuaderno actualizado exitosamente', data: cuaderno });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ exito: false, mensaje: 'Error de validación', errores: mensajes });
    }
    console.error('Error en actualizarCuaderno:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ELIMINAR cuaderno — DELETE /api/cuadernos/:id
const eliminarCuaderno = async (req, res) => {
  try {
    const cuaderno = await CuadernoPedagogico.findByIdAndDelete(req.params.id);
    if (!cuaderno) {
      return res.status(404).json({ exito: false, mensaje: 'Cuaderno no encontrado' });
    }
    res.json({ exito: true, mensaje: 'Cuaderno eliminado exitosamente' });
  } catch (error) {
    console.error('Error en eliminarCuaderno:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  crearCuaderno,
  obtenerCuadernos,
  obtenerCuaderno,
  actualizarCuaderno,
  eliminarCuaderno,
};
