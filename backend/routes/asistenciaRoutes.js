

const express = require('express');
const router = express.Router();
const {
  registrarAsistencia,
  obtenerAsistencia,
  actualizarAsistencia,
  resumenAsistencia,
  eliminarAsistencia,
} = require('../controllers/asistenciaController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/resumen', resumenAsistencia);

router.route('/')
  .post(registrarAsistencia)
  .get(obtenerAsistencia);

router.route('/:id')
  .put(actualizarAsistencia)
  .delete(authorize('admin', 'director', 'docente'), eliminarAsistencia);

module.exports = router;
