

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
  .post(authorize('admin', 'director'), crearCurso)
  .get(obtenerCursos);

router.route('/:id')
  .get(obtenerCurso)
  .put(authorize('admin', 'director'), actualizarCurso)
  .delete(authorize('admin', 'director'), eliminarCurso);

router.post('/:id/estudiantes', agregarEstudiante);

module.exports = router;
