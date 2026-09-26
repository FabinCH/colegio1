// ============================================
// routes/materiaRoutes.js — Rutas de Materias
// ============================================
//
// RUTAS DISPONIBLES (todas protegidas con JWT):
//   POST   /api/materias       → Crear materia
//   GET    /api/materias       → Listar todas (filtrable por nivel y grado)
//   GET    /api/materias/:id   → Obtener una por ID
//   PUT    /api/materias/:id   → Actualizar
//   DELETE /api/materias/:id   → Eliminar

const express = require('express');
const router = express.Router();
const {
  crearMateria,
  obtenerMaterias,
  obtenerMateria,
  actualizarMateria,
  eliminarMateria,
} = require('../controllers/materiaController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .post(authorize('admin', 'director'), crearMateria)
  .get(obtenerMaterias);

router.route('/:id')
  .get(obtenerMateria)
  .put(authorize('admin', 'director'), actualizarMateria)
  .delete(authorize('admin', 'director'), eliminarMateria);

module.exports = router;
