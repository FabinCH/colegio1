// ============================================
// routes/evaluacionRoutes.js — Rutas de Evaluación
// ============================================
//
// RUTAS DISPONIBLES (todas protegidas con JWT):
//   POST   /api/evaluaciones              → Registrar evaluación individual
//   POST   /api/evaluaciones/lote         → Registrar evaluaciones en lote
//   GET    /api/evaluaciones              → Listar evaluaciones
//   GET    /api/evaluaciones/centralizador → Centralizador de notas
//   PUT    /api/evaluaciones/:id          → Actualizar evaluación
//   DELETE /api/evaluaciones/:id          → Eliminar evaluación

const express = require('express');
const router = express.Router();
const {
  registrarEvaluacion,
  registrarEvaluacionesLote,
  obtenerEvaluaciones,
  centralizador,
  actualizarEvaluacion,
  eliminarEvaluacion,
} = require('../controllers/evaluacionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

// Rutas específicas ANTES de /:id
router.post('/lote', registrarEvaluacionesLote);
router.get('/centralizador', centralizador);

router.route('/')
  .post(registrarEvaluacion)
  .get(obtenerEvaluaciones);

router.route('/:id')
  .put(actualizarEvaluacion)
  .delete(authorize('admin', 'director', 'docente'), eliminarEvaluacion);

module.exports = router;
