// ============================================
// controllers/studentController.js — CRUD de Estudiantes
// ============================================
//
// ¿QUÉ ES CRUD?
// Create (crear), Read (leer), Update (actualizar), Delete (borrar).
// Son las 4 operaciones básicas que se hacen con cualquier dato.

const Student = require('../models/Student');
const CuadernoPedagogico = require('../models/CuadernoPedagogico');
const Inscripcion = require('../models/Inscripcion');

// ================================================
// CREAR un nuevo estudiante
// ================================================
// POST /api/estudiantes
const crearEstudiante = async (req, res) => {
  try {
    // Los docentes NO pueden crear estudiantes
    if (req.usuario.rol === 'docente') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Los docentes no tienen permiso para registrar estudiantes.',
      });
    }

    const estudiante = await Student.create({
      ...req.body,
      registradoPor: req.usuario.id,
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Estudiante registrado exitosamente',
      data: estudiante,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Error de clave duplicada (RUDE repetido)
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe un estudiante con ese código RUDE',
      });
    }
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: mensajes,
      });
    }
    console.error('Error en crearEstudiante:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ================================================
// OBTENER todos los estudiantes (con paginación y búsqueda)
// ================================================
// GET /api/estudiantes?page=1&limit=20&buscar=texto
//
// RESTRICCIÓN DE ROL:
// - admin/director: ven TODOS los estudiantes
// - docente: solo ve estudiantes inscritos en sus materias (cuadernos)
const obtenerEstudiantes = async (req, res) => {
  try {
    const { page, limit, buscar } = req.query;

    // ── Si es docente, obtener solo IDs de estudiantes inscritos en sus cuadernos ──
    let idsEstudiantesPermitidos = null;
    if (req.usuario.rol === 'docente') {
      // 1. Buscar cuadernos del docente
      const cuadernos = await CuadernoPedagogico.find({ docente: req.usuario.id }).select('_id');
      const cuadernoIds = cuadernos.map(c => c._id);

      if (cuadernoIds.length === 0) {
        // El docente no tiene cuadernos → no ve ningún estudiante
        return res.json({
          exito: true,
          cantidad: 0,
          total: 0,
          pagina: 1,
          totalPaginas: 0,
          data: [],
        });
      }

      // 2. Buscar inscripciones en esos cuadernos
      const inscripciones = await Inscripcion.find({ cuaderno: { $in: cuadernoIds } }).select('estudiante');
      idsEstudiantesPermitidos = [...new Set(inscripciones.map(i => i.estudiante.toString()))];

      if (idsEstudiantesPermitidos.length === 0) {
        return res.json({
          exito: true,
          cantidad: 0,
          total: 0,
          pagina: 1,
          totalPaginas: 0,
          data: [],
        });
      }
    }

    // Construir filtro de búsqueda por CI o RUDE
    let filtro = {};

    // Si es docente, agregar filtro de IDs permitidos
    if (idsEstudiantesPermitidos) {
      filtro._id = { $in: idsEstudiantesPermitidos };
    }

    if (buscar && buscar.trim()) {
      const texto = buscar.trim();
      const busquedaFiltro = {
        $or: [
          { ci: { $regex: texto, $options: 'i' } },
          { rude: { $regex: texto, $options: 'i' } },
          { nombres: { $regex: texto, $options: 'i' } },
          { apellidos: { $regex: texto, $options: 'i' } },
        ],
      };
      // Combinar filtro de docente con búsqueda
      if (idsEstudiantesPermitidos) {
        filtro = { $and: [{ _id: { $in: idsEstudiantesPermitidos } }, busquedaFiltro] };
      } else {
        filtro = busquedaFiltro;
      }
    }

    // Si envían page y limit, paginar. Si no, retornar todos.
    if (page && limit) {
      const pag = Math.max(1, Number(page));
      const lim = Math.min(100, Math.max(1, Number(limit)));
      const skip = (pag - 1) * lim;

      const [estudiantes, total] = await Promise.all([
        Student.find(filtro).sort({ apellidos: 1, nombres: 1 }).skip(skip).limit(lim),
        Student.countDocuments(filtro),
      ]);

      return res.json({
        exito: true,
        cantidad: estudiantes.length,
        total,
        pagina: pag,
        totalPaginas: Math.ceil(total / lim),
        data: estudiantes,
      });
    }

    // Sin paginación: retornar todos
    const estudiantes = await Student.find(filtro).sort({ apellidos: 1, nombres: 1 });

    res.json({
      exito: true,
      cantidad: estudiantes.length,
      data: estudiantes,
    });
  } catch (error) {
    console.error('Error en obtenerEstudiantes:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ================================================
// OBTENER un estudiante por ID
// ================================================
// GET /api/estudiantes/:id
const obtenerEstudiante = async (req, res) => {
  try {
    const estudiante = await Student.findById(req.params.id);

    if (!estudiante) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Estudiante no encontrado',
      });
    }

    res.json({ exito: true, data: estudiante });
  } catch (error) {
    console.error('Error en obtenerEstudiante:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ================================================
// ACTUALIZAR un estudiante
// ================================================
// PUT /api/estudiantes/:id
const actualizarEstudiante = async (req, res) => {
  try {
    const estudiante = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Retorna el documento ACTUALIZADO (no el viejo)
        runValidators: true, // Ejecuta las validaciones del schema
      }
    );

    if (!estudiante) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Estudiante no encontrado',
      });
    }

    res.json({
      exito: true,
      mensaje: 'Estudiante actualizado exitosamente',
      data: estudiante,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: mensajes,
      });
    }
    console.error('Error en actualizarEstudiante:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

// ================================================
// ELIMINAR un estudiante
// ================================================
// DELETE /api/estudiantes/:id
const eliminarEstudiante = async (req, res) => {
  try {
    const estudiante = await Student.findByIdAndDelete(req.params.id);

    if (!estudiante) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Estudiante no encontrado',
      });
    }

    res.json({
      exito: true,
      mensaje: 'Estudiante eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en eliminarEstudiante:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
};
