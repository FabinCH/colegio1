// ============================================
// routes/studentRoutes.js — Rutas de Estudiantes
// ============================================
//
// RUTAS DISPONIBLES (todas protegidas con JWT):
//   POST   /api/estudiantes       → Crear estudiante
//   GET    /api/estudiantes       → Listar todos
//   GET    /api/estudiantes/:id   → Obtener uno por ID
//   PUT    /api/estudiantes/:id   → Actualizar
//   DELETE /api/estudiantes/:id   → Eliminar

const express = require('express');
const router = express.Router();
const {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
} = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Todas las rutas de estudiantes requieren autenticación
router.use(protect);

router.route('/')
  .post(authorize('admin', 'director'), crearEstudiante)
  .get(obtenerEstudiantes);

router.route('/:id')
  .get(obtenerEstudiante)
  .put(authorize('admin', 'director'), actualizarEstudiante)
  .delete(authorize('admin', 'director'), eliminarEstudiante);

module.exports = router;
