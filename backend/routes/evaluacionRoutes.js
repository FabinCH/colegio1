

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

router.post('/lote', registrarEvaluacionesLote);
router.get('/centralizador', centralizador);

router.route('/')
  .post(registrarEvaluacion)
  .get(obtenerEvaluaciones);

router.route('/:id')
  .put(actualizarEvaluacion)
  .delete(authorize('admin', 'director', 'docente'), eliminarEvaluacion);

module.exports = router;
