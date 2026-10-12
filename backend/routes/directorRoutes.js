

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const directorController = require('../controllers/directorController');

router.use(protect);
router.use(authorize('director', 'admin'));

router.get('/reportes-curso', directorController.obtenerReportesPorCurso);
router.get('/rendimiento-docente', directorController.obtenerRendimientoDocente);
router.get('/asistencia', directorController.obtenerEstadisticasAsistencia);
router.get('/ranking-notas', directorController.obtenerRankingNotas);

router.get('/cuadernos', directorController.listarCuadernosSupervision);
router.put('/cuadernos/:id/supervisar', directorController.supervisarCuaderno);

router.get('/exportar/:tipo', directorController.generarExportacionSIGED);

module.exports = router;
