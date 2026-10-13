

const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');

const {
  listarUsuarios,
  crearDocente,
  editarUsuario,
  asignarRol,
  eliminarUsuario,
  asignarMateriaDocente,
  obtenerConfigAnio,
  actualizarConfigAnio,
  listarUnidades,
  crearUnidad,
  actualizarUnidad,
  eliminarUnidad,
  obtenerReportesGlobales,
  obtenerAuditoria,
} = require('../controllers/adminController');

router.use(protect, authorize('admin', 'director'));

router.route('/usuarios')
  .get(listarUsuarios)
  .post(crearDocente);

router.put('/usuarios/:id',      editarUsuario);
router.put('/usuarios/:id/rol',  asignarRol);
router.delete('/usuarios/:id',   eliminarUsuario);

router.put('/materias/:id/asignar-docente', asignarMateriaDocente);

router.route('/anio-escolar')
  .get(obtenerConfigAnio)
  .put(actualizarConfigAnio);

router.route('/unidades-educativas')
  .get(listarUnidades)
  .post(crearUnidad);

router.route('/unidades-educativas/:id')
  .put(actualizarUnidad)
  .delete(eliminarUnidad);

router.get('/reportes-globales', obtenerReportesGlobales);

router.get('/auditoria', obtenerAuditoria);

module.exports = router;
