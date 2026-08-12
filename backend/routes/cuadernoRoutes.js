// ============================================
// routes/cuadernoRoutes.js — Rutas de Cuaderno Pedagógico
// ============================================
//
// RUTAS DISPONIBLES (todas protegidas con JWT):
//   POST   /api/cuadernos       → Crear cuaderno pedagógico
//   GET    /api/cuadernos       → Listar cuadernos (docente ve los suyos)
//   GET    /api/cuadernos/:id   → Obtener uno con estudiantes
//   PUT    /api/cuadernos/:id   → Actualizar carátula
//   DELETE /api/cuadernos/:id   → Eliminar

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
  .put(actualizarCuaderno)
  .delete(authorize('admin', 'director', 'docente'), eliminarCuaderno);

module.exports = router;
