

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

router.use(protect);

router.route('/')
  .post(authorize('admin', 'director'), crearEstudiante)
  .get(obtenerEstudiantes);

router.route('/:id')
  .get(obtenerEstudiante)
  .put(authorize('admin', 'director'), actualizarEstudiante)
  .delete(authorize('admin', 'director'), eliminarEstudiante);

module.exports = router;
