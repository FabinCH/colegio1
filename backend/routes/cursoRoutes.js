// ============================================
// routes/cursoRoutes.js — Rutas de Cursos/Paralelos
// ============================================
//
// RUTAS DISPONIBLES (todas protegidas con JWT):
//   POST   /api/cursos                    → Crear curso
//   GET    /api/cursos                    → Listar todos
//   GET    /api/cursos/:id                → Obtener uno por ID
//   PUT    /api/cursos/:id                → Actualizar
//   POST   /api/cursos/:id/estudiantes    → Agregar estudiante al curso
//   DELETE /api/cursos/:id                → Eliminar

const express = require('express');
const router = express.Router();
const {
  crearCurso,
  obtenerCursos,
  obtenerCurso,
  actualizarCurso,
  agregarEstudiante,
  eliminarCurso,
} = require('../controllers/cursoController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .post(crearCurso)
  .get(obtenerCursos);

router.route('/:id')
  .get(obtenerCurso)
  .put(actualizarCurso)
  .delete(authorize('admin', 'director'), eliminarCurso);

// Ruta especial para agregar estudiantes a un curso
router.post('/:id/estudiantes', agregarEstudiante);

module.exports = router;
