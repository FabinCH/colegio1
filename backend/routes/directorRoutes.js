// ============================================
// routes/directorRoutes.js
// ============================================

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const directorController = require('../controllers/directorController');

// Todas las rutas aquí están protegidas y requieren rol 'director' o 'admin'
router.use(protect);
router.use(authorize('director', 'admin'));

// Reportes y Estadísticas
router.get('/reportes-curso', directorController.obtenerReportesPorCurso);
router.get('/rendimiento-docente', directorController.obtenerRendimientoDocente);
router.get('/asistencia', directorController.obtenerEstadisticasAsistencia);
router.get('/ranking-notas', directorController.obtenerRankingNotas);

// Supervisión de Cuadernos
router.get('/cuadernos', directorController.listarCuadernosSupervision);
router.put('/cuadernos/:id/supervisar', directorController.supervisarCuaderno);

// SIGED - Exportaciones
router.get('/exportar/:tipo', directorController.generarExportacionSIGED);

module.exports = router;
