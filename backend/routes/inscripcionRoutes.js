

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
