// ============================================
// routes/inscripcionRoutes.js — Rutas de Inscripción
// ============================================
//
// RUTAS DISPONIBLES (todas protegidas con JWT):
//   POST   /api/inscripciones              → Inscribir estudiante a un cuaderno
//   GET    /api/inscripciones?cuaderno=xxx → Listar estudiantes inscritos
//   DELETE /api/inscripciones/:id          → Eliminar inscripción

const express = require('express');
const router = express.Router();
const {
  inscribirEstudiante,
  obtenerInscritos,
  eliminarInscripcion,
} = require('../controllers/inscripcionController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .post(inscribirEstudiante)
  .get(obtenerInscritos);

router.route('/:id')
  .delete(eliminarInscripcion);

module.exports = router;
