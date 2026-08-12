// ============================================
// routes/asistenciaRoutes.js — Rutas de Asistencia
// ============================================
//
// RUTAS DISPONIBLES (todas protegidas con JWT):
//   POST   /api/asistencia            → Registrar asistencia diaria
//   GET    /api/asistencia            → Listar asistencia (filtrar por cuaderno y trimestre)
//   GET    /api/asistencia/resumen    → Resumen por trimestre (conteo A/R/L/F)
//   PUT    /api/asistencia/:id        → Actualizar asistencia de un día
//   DELETE /api/asistencia/:id        → Eliminar registro

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

// ⚠️ IMPORTANTE: /resumen debe ir ANTES de /:id
// Si no, Express pensará que "resumen" es un ID
router.get('/resumen', resumenAsistencia);

router.route('/')
  .post(registrarAsistencia)
  .get(obtenerAsistencia);

router.route('/:id')
  .put(actualizarAsistencia)
  .delete(authorize('admin', 'director', 'docente'), eliminarAsistencia);

module.exports = router;
