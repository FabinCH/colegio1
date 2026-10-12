

const express = require('express');
const router = express.Router();
const {
  crearCuaderno,
  obtenerCuadernos,
  obtenerCuaderno,
  actualizarCuaderno,
  eliminarCuaderno,
} = require('../controllers/cuadernoController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .post(crearCuaderno)
  .get(obtenerCuadernos);

router.route('/:id')
  .get(obtenerCuaderno)
  .put(authorize('admin', 'director'), actualizarCuaderno)
  .delete(authorize('admin', 'director', 'docente'), eliminarCuaderno);

module.exports = router;
